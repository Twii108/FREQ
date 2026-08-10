from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.apps import AuthConfig
from django.contrib.contenttypes.apps import ContentTypesConfig

# Patch Django REST Framework to map MongoDB's ObjectIdAutoField to CharField
from rest_framework.serializers import ModelSerializer
from django_mongodb_backend.fields import ObjectIdAutoField
from rest_framework import serializers

ModelSerializer.serializer_field_mapping[ObjectIdAutoField] = serializers.CharField


class MongoAdminConfig(AdminConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"


class MongoAuthConfig(AuthConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"


class MongoContentTypesConfig(ContentTypesConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
