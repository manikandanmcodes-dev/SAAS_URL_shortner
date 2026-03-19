from django.urls import path
from .views import shorten_url, redirect_url, signup, my_urls, create_admin, health
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('shorten/', shorten_url),
    path('health/', health),
    path('signup/', signup),
    path('my-urls/', my_urls),

    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),  # ✅ ADD THIS

    path('<str:short_code>/', redirect_url),
]