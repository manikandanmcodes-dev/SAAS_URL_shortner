from django.urls import path
from .views import shorten_url, redirect_url, signup, my_urls, reset_admin_password
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('shorten/', shorten_url),
    path('reset-admin/', reset_admin_password),
    path('signup/', signup),
    path('my-urls/', my_urls),

    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),  # ✅ ADD THIS

    path('<str:short_code>/', redirect_url),
]