from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    """Custom user manager to handle user creation and superuser creation."""

    def create_user(self, email, display_name, password=None):
        """Create and save a user with the given email, display name, and password."""
        if not email:
            raise ValueError('Users must have an email address')
        if not display_name:
            raise ValueError('Users must have a display name')

        user = self.model(
            email=self.normalize_email(email),
            display_name=display_name,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, display_name, password):
        user = self.create_user(email, display_name, password)
        user.is_admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """Custom user model that extends the default Django user model.
    Includes additional fields for display name, profile picture."""

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    profile_picture = models.URLField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']

    def __str__(self):
        return self.display_name

    def get_full_name(self):
        return self.display_name

    def get_short_name(self):
        return self.display_name