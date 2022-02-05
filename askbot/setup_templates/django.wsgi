"""
WSGI config for Askbot

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/howto/deployment/wsgi/
"""

import os
import sys
from django.core.wsgi import get_wsgi_application

current_directory = os.path.dirname(__file__)
parent_directory = os.path.dirname(current_directory)
module_name = os.path.basename(current_directory)

sys.path.append(parent_directory)
sys.path.append(current_directory)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', f'{module_name}.settings')

application = get_wsgi_application()
