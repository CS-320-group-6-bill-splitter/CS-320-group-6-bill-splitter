"""
URL configuration for bill_splitter project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path('admin/', admin.site.urls),

    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),

    path(
        'households/',
        views.HouseholdListCreateView.as_view(),
        name='household-list-create',
    ),
    path(
        'households/<int:pk>/',
        views.HouseholdDetailView.as_view(),
        name='household-detail',
    ),
    path(
        'households/<int:pk>/leave/',
        views.HouseholdLeaveView.as_view(),
        name='household-leave',
    ),
    path(
        'households/<int:pk>/summary/',
        views.HouseholdSummaryView.as_view(),
        name='household-summary',
    ),
    path(
        'households/<int:pk>/invite/',
        views.HouseholdInviteView.as_view(),
        name='household-invite',
    ),

    path(
        'invitations/<uuid:token>/respond/',
        views.InvitationRespondView.as_view(),
        name='invitation-respond',
    ),

    path(
        'bills/list/<str:status>/<int:household_id>/',
        views.BillListView.as_view(),
        name='bill-list',
    ),
    path(
        'bills/create/<int:household_id>/',
        views.BillCreateView.as_view(),
        name='bill-create',
    ),
    path(
        'bills/detail/<int:household_id>/<int:bill_id>/',
        views.BillDetailView.as_view(),
        name='bill-detail',
    ),

    path(
        'debts/list/<str:status>/<int:household_id>/',
        views.DebtListView.as_view(),
        name='debt-list',
    ),
    path(
        'debts/detail/<int:household_id>/<int:debt_id>/',
        views.DebtDetailView.as_view(),
        name='debt-detail',
    ),
    path(
        'debts/pay/<int:household_id>/<int:debt_id>/',
        views.DebtPayView.as_view(),
        name='debt-pay',
    ),
    path(
        'debts/filter/<int:household_id>/',
        views.DebtFilterView.as_view(),
        name='debt-filter',
    ),

    path(
        'bills/list/<int:household_id>/by-user/<int:other_user_id>/',
        views.BillsByPersonView.as_view(),
        name='bills-by-person',
    ),
    path(
        'debts/list/<int:household_id>/by-user/<int:other_user_id>/',
        views.DebtsByPersonView.as_view(),
        name='debts-by-person',
    ),
]
