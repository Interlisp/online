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
#  Timezone that we should assume dates sent in as args from the user are in
#
declare T_ZONE="America/Los_Angeles"

#
# functions used to query user database
#

get_mongo_uri() {
    echo "$(docker exec ${oio} bash -c "echo \$MONGO_URI")"
}

exec_mongosh() {
	cat >/tmp/tmp-$$
	docker cp /tmp/tmp-$$ ${oio}:/tmp/tmp-$$
        rm /tmp/tmp-$$
        docker exec ${oio} mongosh "`get_mongo_uri`" --file /tmp/tmp-$$ | grep "^~" | sed s/^~//
	docker exec ${oio} rm /tmp/tmp-$$
}

list_users_core() {
   	exec_mongosh <<-EOF
            var l=db.userInfo.aggregate([
                    $1
                    {\$project:
                        { _id:0, created:1, username:1, numLogins:1, lastLogin:1,
                          cdate: { \$dateToString: {date: '\$created', format: '%Y-%m-%d', timezone: '${T_ZONE}', onNull: 'xxxx-xx-xx'}},
                          lldate: { \$dateToString: {date: '\$lastLogin', format: '%Y-%m-%d', timezone: '${T_ZONE}', onNull: 'xxxx-xx-xx'}}
                        }
                    }]);
            print("~#Logins     Created       Last Login    Username");
            print("~-------------------------------------------------------------");
            l.forEach( doc =>
		{ nl = "    " + (doc.numLogins || "x");
                  nl = nl.substring(nl.length-3);
                  print("~", nl, "      ", doc.cdate, "  ", doc.lldate, "  ", doc.username);} );
	EOF
}

list_users() {
	list_users_core
}

list_new_users() {
        match="{\$match: {created: {\$exists: true}, created: {\$gte: ISODate('$1')}}},"
        list_users_core "$match"
}

set_date() {
        local e_date

	if [ -z "$1" ]; then
	    e_date="$(date --date '-1 month' '+%Y-%m-%d')"
	else
	    e_date="$1"
	fi
	tz_offset=`TZ=${T_ZONE} date --date "${e_date} 00:00 +00" +%z`
	e_date="${e_date}T00:00:00${tz_offset}"
        echo "${e_date}"
}

count_guests() {
        exec_mongosh <<-EOF
            var l=db.loginLog.find({username: "guest@online.interlisp.org", timestamp: {\$gte: ISODate('$1')}}).count();
            print("~", l);
	EOF
}

count_logins() {
        exec_mongosh <<-EOF
            var l=db.loginLog.find({username: {\$not: /^guest@online.interlisp.org\$/}, timestamp: {\$gte: ISODate('$1')}}).count();
            print("~", l);
	EOF
}

show_logins() {
        exec_mongosh <<-EOF
            var l=db.loginLog.find({username: {\$not: /^guest@online.interlisp.org\$/}, timestamp: {\$gte: ISODate('$1')}});
            l.forEach( doc => print("~", doc.username) );
	EOF
}

log_logins() {
        exec_mongosh <<-EOF
            var l=db.loginLog.aggregate([
	            {\$match: {timestamp: {\$gte: ISODate('$1')}}},
                    {\$project:
                        { _id:0, username:1, timestamp:1,
                          logdate:
                             {\$dateToString: {date: '\$timestamp', format: '%Y-%m-%d %H:%M', timezone: '${T_ZONE}'}},
			  dow:
                             {\$dayOfWeek: {date: '\$timestamp', timezone: '${T_ZONE}'}}
                        }
                    }
		]);
            var n=["", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            l.forEach( doc => print("~", n[doc.dow], doc.logdate, doc.username) );
	EOF
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
            docker container ls --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}' --filter name=^oio\|oio-dev\$
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
       case $2 in
           list)
               case "$3" in
                   "new")
                       list_new_users `set_date "$4"`
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
       count_guests `set_date "$2"`
       ;;

    # show/count non-guest logins since
    logins)
       case "$2" in
           count)
               count_logins `set_date "$3"`
           ;;

           show)
	       show_logins `set_date "$3"` | /usr/bin/sort | /usr/bin/uniq -c
           ;;

           log)
               log_logins `set_date "$3"`
           ;;

           *)
               echo "Unknown command: ${oio} logins $2"
               echo "Use '${oio} help' for usage."
               echo "Exiting"
               exit 1
            ;;

       esac
     ;;

     # install docker images for new onine-medley release
     medley)

        image=ghcr.io/interlisp/online-medley

        case "I$2I" in


           IpulldevI)
                image=ghcr.io/interlisp/online-medley
                docker image tag ${image}:development ${image}:2bdeleted
		docker pull ${image}:development
                docker image rm ${image}:2bdeleted
                echo "Online-medley development release pulled from Github Container Registry"
           ;;

           Idev2prodI)
		if [ -z "$(docker images -q ${image}:development)" ]
                then
                  echo "ERROR: docker image \"${image}:development\" does not exist."
                  exit 1
                fi
		if [ -n "$(docker images -q ${image}:production-3)" ]
                then
                  docker image rm ${image}:production-3
                fi
		if [ -n "$(docker images -q ${image}:production-2)" ]
                then
                  docker tag ${image}:production-2 ${image}:production-3
                fi
		if [ -n "$(docker images -q ${image}:production-1)" ]
                then
       		  docker tag ${image}:production-1 ${image}:production-2
                fi
		if [ -n "$(docker images -q ${image}:production)" ]
                then
		  docker tag ${image}:production ${image}:production-1
                fi
        	#
                docker tag ${image}:development ${image}:production
		echo "Online-medley moved from development to production."
           ;;

           IrestoreI)
		if [ -z "$(docker images -q ${image}:production-1)" ]
                then
                  echo "ERROR: docker image \"${image}:production-1\" does not exist."
                  echo "Cannot restore previous production version"
                  exit 1
                fi
                docker tag ${image}:production-1 ${image}:production
		if [ -n "$(docker images -q ${image}:production-2)" ]
                then
                  docker tag ${image}:production-2 ${image}:production-1
                fi
		if [ -n "$(docker images -q ${image}:production-3)" ]
                then
       		  docker tag ${image}:production-3 ${image}:production-2
                  docker image rm ${image}:production-3
                fi
		echo "Previous Online-medley production version restored."
           ;;

           *)
               echo "Unknown command: ${oio} medley $2"
               echo "Use '${oio} help' for usage."
               echo "Exiting"
               exit 1
           ;;

	esac

        image=

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

     noRm | norm)
         if [ "${oio}" = "oio-dev" ]; then
             if [ "I$2I" = "IonI" ]; then
                 touch /srv/oio/development/noDockerRm
             elif [ "I$2I" = "IoffI" ]; then
                 rm -f /srv/oio/development/noDockerRm
             else
                 echo "Unknown command: ${oio} noRm $2"
                 echo "Use '${oio} help' for usage."
                 echo "Exiting"
                 exit 1
             fi
         fi
     ;;

     start)
         sudo systemctl start "${oio}".service
     ;;

     stop)
         sudo systemctl stop "${oio}".service
     ;;

     xstat)
         sudo systemctl status "${oio}".service
     ;;

     help)
        echo "Usage:"
        echo
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
        echo "${oio} logins count:  count of non-guest logins in the last month"
        echo "${oio} logins count YYYY-MM-DD:  count of non-guest logins since YYYY-MM-DD"
        echo
        echo "${oio} logins show:  show non-guest logins in the last month"
        echo "${oio} logins show YYYY-MM-DD:  show non-guest logins since YYYY-MM-DD"
        echo
        echo "${oio} logins log:  show logins log for the last month"
        echo "${oio} logins log YYYY-MM-DD:  show logins log since YYYY-MM-DD"
        echo
	echo "${oio} medley pulldev:  pull latest development (test) online-medley image from GHCR"
        echo "${oio} medley dev2prod:  move current development online-medley image to production status"
        echo "${oio} medley restore:  restore previous production online-medley image"
	echo
	echo "${oio} portal pulldev:  pull latest development portal (online-development) docker image from GHCR"
        echo "${oio} portal pullprod:  pull latest production portal (online-production) docker image from GHCR"
        echo
        if [ "${oio}" = "oio-dev" ]; then
            echo "${oio} noRm on: turn noDockerRm on"
            echo "${oio} noRm off: turn noDockerRm off"
            echo
        fi
        echo "${oio} start:  start ${oio}.service"
        echo "${oio} stop:   stop ${oio}.service"
        echo "${oio} xstat:  = systemctl status ${oio}.service"
        echo
	;;

    *)
        echo "Unknown command: ${oio} $1 $2 $3 $4"
        echo "Use '${oio} help' for usage."
        echo "Exiting"

        exit 1
        ;;
esac

