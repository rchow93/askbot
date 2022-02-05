#!/usr/bin/env bash
export $(cat /cron_environ | xargs)
cd ${ASKBOT_SITE:-/askbot-site}
/usr/local/bin/python manage.py send_email_alerts > /proc/1/fd/1 2>/proc/1/fd/2
