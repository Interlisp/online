#!/bin/bash
#
#    oio.sh:  grab-bag of utilities for managing the online.interlisp.org web-portal
#
#    Frank Halasz  2022-04-29
#
#
#

#
#  operate on dev or production
#
oio=$(basename "$0")
oio=${oio%.sh}

#
# functions used to query user database
#
list_users_core() {
   	cat >/tmp/tmp-$$ <<-EOF
            var l=db.userInfo.aggregate([
                    $1
                    {\$project:
                        { _id:0, created:1, username:1, numLogins:1, lastLogin:1,
                          cdate: { \$dateToString: {date: '\$created', format: '%Y-%m-%d', onNull: 'xxxx-xx-xx'}},
                          lldate: { \$dateToString: {date: '\$lastLogin', format: '%Y-%m-%d', onNull: 'xxxx-xx-xx'}}
                        }
                    }]);
            print("~#Logins     Created       Last Login    Username");
            print("~-------------------------------------------------------------");
            l.forEach( doc =>
		{ nl = "    " + (doc.numLogins || "x");
                  nl = nl.substring(nl.length-3);
                  print("~", nl, "      ", doc.cdate, "  ", doc.lldate, "  ", doc.username);} );
	EOF
	docker cp /tmp/tmp-$$ ${oio}:/tmp/tmp-$$
        rm /tmp/tmp-$$
        docker exec ${oio} mongosh $mongo_uri --file /tmp/tmp-$$ | grep "^~" | sed s/^~//
}

list_users() {
	list_users_core
}

list_new_users() {
        match="{\$match: {created: {\$exists: true}, created: {\$gte: ISODate('$1')}}},"
        list_users_core "$match"
}

count_guests() {
        cat >/tmp/tmp-$$ <<-EOF
            var l=db.loginLog.find({username: "guest@online.interlisp.org", timestamp: {\$gte: ISODate('$1')}}).count();
            print("~", l);
	EOF
	docker cp /tmp/tmp-$$ ${oio}:/tmp/tmp-$$
        rm /tmp/tmp-$$
        docker exec ${oio} mongosh $mongo_uri --file /tmp/tmp-$$ | grep "^~" | sed s/^~//
}


#
#  Main case statement
#

case $1 in


    #  status:  list running docker containers and their status
    status)
        if [ "$2" = "all" ]; then
            docker container ls --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'
        else
            docker container ls --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'
        fi
        ;;

    # ghosts:  list/kill online medley docker containers running more than 12 hours
    ghosts)
        ghosts=$(docker container ls --format="{{.Names}}@@{{.Image}}" | grep online-medley | sed s/@@.*$//)
        for g in $ghosts; do
             start=$(date --date="$(docker container ls -f name=$g --format={{.CreatedAt}} | sed s/+0000//)" "+%s")
             now=$(date "+%s")
             hoursUp=$(( ($now - $start) / 3600 ))
             if [ $hoursUp -gt 12 ]; then
                 docker container ls -f name=$g --format "{{.ID}}\t{{.Names}}\t{{.Status}}"
                 if [ "$2" = "kill" ]; then
                      docker container kill $g >/dev/null
                      echo "..... killed"
                 fi
             fi
        done
        ;;

   # query user database
   users)
       mongo_uri=$(docker exec ${oio} bash -c "echo \$MONGO_URI")
       case $2 in
           list)
               case "$3" in
                   "new")
                       if [ -z "$4" ]; then
                           sDate="$(date --date '-1 month' '+%Y-%m-%d')"
                       else
                           sDate="$4"
                       fi
                       list_new_users $sDate
                       ;;
                   *)
                       list_users
                       ;;
               esac
               ;;
           *)
               echo "Unknown command: ${oio} users $2 $3 $4"
               echo "Use '${oio} help' for usage."
               echo "Exiting"
               exit 1
               ;;
       esac
       ;;

    # count guest logins since
    guests)
       mongo_uri=$(docker exec ${oio} bash -c "echo \$MONGO_URI")
       if [ -z "$2" ]; then
           sDate="$(date --date '-1 month' '+%Y-%m-%d')"
       else
           sDate="$2"
       fi
       count_guests $sDate
       ;;

     # install docker images for new onine-medley release
     medley)
        case "I$2I" in


           IpulldevI)
		docker pull ghcr.io/interlisp/online-medley:development
                echo "Online-medley development release pulled from Github Container Registry"
           ;;

           Idev2prodI)
		lastlast1=$(docker images -q ghcr.io/interlisp/online-medley:lastlastproduction)
		docker tag ghcr.io/interlisp/online-medley:lastproduction ghcr.io/interlisp/online-medley:lastlastproduction
		docker tag ghcr.io/interlisp/online-medley:production ghcr.io/interlisp/online-medley:lastproduction
		docker tag ghcr.io/interlisp/online-medley:development ghcr.io/interlisp/online-medley:production
		echo "Online-medley moved from development to production."
           ;;

           *)
               echo "Unknown command: ${oio} medley $2"
               echo "Use '${oio} help' for usage."
               echo "Exiting"
               exit 1
           ;;

	esac
     ;;

     # install docker image for new portal releases - dev and production
     portal)
	case "I$2I" in

	  IpulldevI)
		current=$(docker images -q ghcr.io/interlisp/online-development:latest)
		docker pull ghcr.io/interlisp/online-development:latest
		if [ ! -z "${current}" ]; then docker image rm ${current}; echo 2 ${current}; fi
                echo "Latest online-development docker image pulled from GHCR"
          ;;

          IpullprodI)
		lastlast2=$(docker images -q ghcr.io/interlisp/online-production:lastlast)
		docker tag ghcr.io/interlisp/online-production:last ghcr.io/interlisp/online-production:lastlast
		docker tag ghcr.io/interlisp/online-production:latest ghcr.io/interlisp/online-production:last
		docker pull ghcr.io/interlisp/online-production:latest
		if [ ! -z "${lastlast2}" ]; then docker image rm ${lastlast2}; echo 2 ${lastlast2}; fi
                echo "Latest online-production docker image pulled from GHCR"
	  ;;

           *)
               echo "Unknown command: ${oio} portal $2"
               echo "Use '${oio} help' for usage."
               echo "Exiting"
               exit 1
           ;;

        esac
     ;;

    help)
        echo "Usage:"
        echo "${oio} status:  lists status of oio and oio-dev docker containers"
        echo "${oio} status all:  lists status of all oio docker containers including running user medley containers"
        echo
        echo "${oio} ghosts:  lists all Medley docker containers that have been running for greater than 12 hours"
        echo "${oio} ghosts kill:  kill all Medley docker containers that have been running for greater than 12 hours"
        echo
        echo "${oio} users list:  list all registered users"
        echo "${oio} users list new:  list users registered in the last month"
        echo "${oio} users list new YYYY-MM-DD:  list new users registered since YYYY-MM-DD"
        echo
        echo "${oio} guests:  count of guest logins in the last month"
        echo "${oio} guests YYYY-MM-DD:  count of guest logins since YYYY-MM-DD"
        echo
	echo "${oio} medley pulldev:  pull latest development (test) online-medley image from GHCR"
        echo "${oio} medley dev2prod:  move current development online-medley image to production status"
	echo
	echo "${oio} portal pulldev:  pull latest development portal (online-development) docker image from GHCR"
        echo "${oio} portal pullprod:  pull latest production portal (online-production) docker image from GHCR"
        echo
	;;

    *)
        echo "Unknown command: ${oio} $1 $2 $3 $4"
        echo "Use '${oio} help' for usage."
        echo "Exiting"

        exit 1
        ;;
esac

