# On Askbot deployments
This is a model of what askbot-setup usually should deploy

    {
        'manage.py': None
        'log': {
            'askbot.log': None
        },
        'askbot_site': {
            'settings.py': None,
            '__init__.py': None,
            'celery_app.py': None,
            'urls.py': None,
        },
        'askbot_app': {
            'cron': {
                'send_email_alerts.sh': None
            },
            'doc': #copy of doc/ from askbot module
            'upfiles': {}
        }
    }

None values mean key is a file created by askbot setup, values of type
dict meand key is a directory. The syntax error means 'doc' is complicated.

`askbot-setup -n /path/to/destdir`
means "install Askbot into this directory". -n therefore provides the root
directory for the Django project. Everything else must be placed in this
directory.
=> $(addprefix /path/to/destdir, askbot_site, log, askbot_app, manage.py)

Let's look at each of the four top level objects
* askbot_site,
* log,
* askbot_app and
* manage.py

## askbot_site

Django's usual approach is to duplicate the root dir's basename. Deploying
into `/path/to/destdir` should yield `/path/to/destdir/destdir` for 'askbot-site'.

If `manage.py` already exists, then we are deploying into an existing Django
project. Usually this means `/path/to/destdir/destdir` does already exist.
Overwriting any of the existing files would break the existing project and
potentially leaves us with a mix of our freshly deployed Askbot files and some
custom files that were there before the Askbot deployment but weren't
overwritten during the deployment, because they don't exist in vanilla Askbot.
Why would anybody want to deploy Askbot into an existing project?

##### Reason 1: People want to add Askbot to their existing project.
In this case
    overwriting is not what we want. Adding Askbot to an existing project means
    adding 'askbot_app' and adding Askbot to urls.py. One also has to (probably) add Celery,
    add Askbot to INSTALLED_APPs and ensure that settings.py has everything else
    required by Askbot. There is no reason to believe simply overwriting anything
    in 'askbot_site' gets us any closer to this goal than not changing 'askbot_site'
    at all.
##### Reason 2: The admin wants to reset an existing Askbot project to its original state.
In that case
    we shouldn't just overwrite 'askbot_site' but delete the entire directory
    and rebuilt it from scratch, to ensure there aren't any remnants of the old
    deployment.
##### Reason 3: The admin wants to migrate from an old Askbot installation/version to a new one.
 In that case we
    most likely want to keep a lot of the existing config around and not(!)
    overwrite it.
##### Reason 4: The admin wants to put Askbot exactly into this directory, because other directories are not an option.
In this case, but at the same time not for reasons 1, 2 or 3, seems like a
    corner case. Would it be too much to ask the admin to clean out the
    directory before deploying Askbot there? I think not.
##### Conclusion: Overwriting 'askbot_site' is never really useful.
#### Approach
With reasons 1 and 3 we deploy 'askbot_site' into a differently named directory.
As a result there will two valid site configs in the project root. The one that
has been there before and the one created by `askbot-setup`. Which config is
effectively used, is determined through `manage.py` or at least through the
environment variable `DJANGO_SETTINGS_MODULE`. With this setup, admins can
**manually** merge files or **manually** change `manage.py` to point to the
newly deployed `settings.py`.
    
With reasons 2 and 4 we want to create a clean 'askbot_site' directory.
Effectively, we want to replace the existing site setting. For the best result
we rename the original site config directory so that we can install Askbot's
'askbot_site' directory as if we were doing a green field deployment. This
avoids unwanted side effects. With this approach, admins can refer to their old
deployments or even modify `manage.py` to switch back to the old deployment.

## log

Django default projects do not have a dedicated log dir. This is something
Askbot specific. Consequently, log should be moved into 'askbot_app', especially
when people want to add Askbot to their existing project. Should we ever
overwrite existing log files? NO! We can rename them or even `logrotate` them.
But deleting seems wreckless and not useful.The log dir name and its location are currently
hard coded into Askbot. This is weired because it seems there is no requirement
for it. Everything else can be modified, why not the log dir name and location?

#####Approach:
Make log dir configurable and rotate existing files. Notify the user
    when rotating files.

## askbot_app

This is really Askbot deployment specific and only Askbot deployment specific.
A running Askbot refers to files or directories at this location. Stuff in here
only interacts with other apps if they want to interact with this Askbot deployment.

##### cron/
This directory holds the one shell script that we want cron to run. We should
also add our suggestion of a corresponding crontab, for users to add. Why would
anybody want to overwrite it?
- Customization
- Upgrade
- Reset

These seem valid and realtively frequent. `askbot-setup` should have commands for
running `crontab` and have the capability to conditionallly overwrite existing configs.

##### doc/
This is a copy of the documentation's source code. A copy is probably not all
that helpful, but putting some form of consumable documentation into the
deployment may be helpful. It doesn't seem reasonable that users would modify
Askbot's documentation source on a per deployment basis. Rendered versions,
however can/should change with Askbot versions and the form the users want to
consume (PDF, HTML, whatever). Enabling askbot-setup to render the documentation
into `doc/` would be nice to have. As currently we are only copying source,
it is probably more sensible to link to the source code and with changing
versions `askbot-setup` should be able to update the link.

##### upfiles/
Initially empty, populated by Askbot users, not admins/operators, but the
consumers of the deployed Askbot. Files in this directory are references by
database entries and therefore cannot be moved/deleted without compromising
Askbot's data integrity. However, management operations like "backup" and "restore"
may be nice. Do those exist? This is nothing the installer does though.

The
installer creates this directory and if it already exists ... then it exists.
Maybe a warning message that there is data in this directory which may be
unrelated to the database entries would be nice. There is also the potential for
a reset/fresh install which warrants a wipe of this directory. It can be
sensible to have the wipe in the installer.

##### Conclusion: Having the installer work with existing files is useful in many cases.
##### Approach
Make the installer work under the assumption that it does a clean
    field deployment. Give it a switch to work with existing files and directories.
    Issue warnings or raise exceptions if attempting to overwrite files with
    the overwrite switch set.

## manage.py

 There is nothing fancy about this file. On fresh installations we want to
 write it and make it point to 'askbot_site.settings'. On any other use case???

