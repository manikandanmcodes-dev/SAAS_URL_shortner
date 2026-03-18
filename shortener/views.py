from django.http import JsonResponse, HttpResponse
from django.shortcuts import redirect
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from .models import URL
import json
import random
import string

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


# 🔐 SIGNUP
@csrf_exempt
def signup(request):
    if request.method == 'POST':
        data = json.loads(request.body or '{}')

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'})

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return JsonResponse({'message': 'User created successfully'})

    return JsonResponse({'error': 'Only POST method allowed'})


# 🔧 GENERATE SHORT CODE
def generate_short_code(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


# 🔗 SHORTEN URL (JWT REQUIRED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shorten_url(request):
    original_url = request.data.get('url')
    custom_code = request.data.get('custom_code')  # 🔥 NEW

    if not original_url:
        return JsonResponse({'error': 'URL is required'}, status=400)

    user = request.user

    # 🔥 If user gives custom alias
    if custom_code:
        if URL.objects.filter(short_code=custom_code).exists():
            return JsonResponse({'error': 'Custom code already taken'}, status=400)
        short_code = custom_code
    else:
        short_code = generate_short_code()
        while URL.objects.filter(short_code=short_code).exists():
            short_code = generate_short_code()

    URL.objects.create(
        user=user,
        original_url=original_url,
        short_code=short_code
    )

    return JsonResponse({
        'short_url': f'http://127.0.0.1:8000/{short_code}'
    })

# 🔁 REDIRECT
def redirect_url(request, short_code):
    try:
        url = URL.objects.get(short_code=short_code)
        url.clicks += 1
        url.save()
        return redirect(url.original_url)
    except URL.DoesNotExist:
        return HttpResponse("Link not found 😢")


# 📊 GET USER URLS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_urls(request):
    urls = URL.objects.filter(user=request.user)

    data = []
    total_clicks = 0

    for url in urls:
        total_clicks += url.clicks

        data.append({
            'original_url': url.original_url,
            'short_code': url.short_code,
            'clicks': url.clicks
        })

    return JsonResponse({
        'total_links': urls.count(),
        'total_clicks': total_clicks,
        'urls': data
    })