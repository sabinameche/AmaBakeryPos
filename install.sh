#!/bin/bash

echo "📦 Creating development utilities..."
echo "====================================="

# Create start.sh
cat > start.sh << 'EOF'
#!/bin/bash

# -------- Simple Start Functions --------
djstart() {
    if [ ! -d "Backend/mysite" ]; then
        echo "❌ Django project not found (Backend/mysite)"
        return 1
    fi

    cd Backend || return
    [ -d "env" ] || { echo "❌ env not found"; return 1; }
    . env/bin/activate
    cd mysite || return
    python manage.py runserver
}

nodestart() {
    if [ ! -d "frontend" ]; then
        echo "❌ Frontend folder not found"
        return 1
    fi

    cd frontend || return
    NODE_OPTIONS="--max-old-space-size=1024" npm run dev
}

sdn() {
    echo "Starting Django and Node servers..."
    djstart &
    DJ_PID=$!
    nodestart &
    NODE_PID=$!
    
    echo "✅ Servers started!"
    echo "Django PID: $DJ_PID"
    echo "Node PID: $NODE_PID"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    
    trap 'kill $DJ_PID $NODE_PID 2>/dev/null; echo " Servers stopped"; exit' INT
    wait
}

# -------- Kill Functions --------
kill_django() {
    echo "🔫 Killing Django on port 8000..."
    local PID
    PID="$(lsof -ti tcp:8000 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        echo "✅ Django killed (PID: $PID)"
    else
        echo "ℹ️ No Django process found on port 8000"
    fi
}

kill_node() {
    echo "🔫 Killing Node on port 5173..."
    local PID
    PID="$(lsof -ti tcp:5173 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        echo "✅ Node killed (PID: $PID)"
    else
        echo "ℹ️ No Node process found on port 5173"
    fi
}

kill_all() {
    echo "🔫 Killing all servers..."
    kill_django
    kill_node
}

killallport() {
    ports=(3000 5173 8000 8080 5000)
    for p in "${ports[@]}"; do
        if lsof -ti tcp:$p >/dev/null 2>&1; then
            local PID
            PID="$(lsof -ti tcp:$p)"
            kill -9 $PID 2>/dev/null || true
            echo "✅ Killed port $p (PID: $PID)"
        fi
    done
}

# -------- Main Start Logic --------
if [ "$1" = "django" ] || [ "$1" = "dj" ]; then
    djstart
elif [ "$1" = "node" ] || [ "$1" = "frontend" ]; then
    nodestart
elif [ "$1" = "kill" ]; then
    if [ "$2" = "django" ] || [ "$2" = "dj" ]; then
        kill_django
    elif [ "$2" = "node" ] || [ "$2" = "frontend" ]; then
        kill_node
    elif [ "$2" = "ports" ]; then
        killallport
    else
        kill_all
    fi
else
    sdn
fi
EOF

chmod +x start.sh
echo "✅ Created start.sh"

# Create reset.sh
cat > reset.sh << 'EOF'
#!/bin/bash

# -------- Kill Functions --------
kill_django() {
    echo "🔫 Killing Django on port 8000..."
    local PID
    PID="$(lsof -ti tcp:8000 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        echo "✅ Django killed (PID: $PID)"
    else
        echo "ℹ️ No Django process found on port 8000"
    fi
}

kill_node() {
    echo "🔫 Killing Node on port 5173..."
    local PID
    PID="$(lsof -ti tcp:5173 2>/dev/null || true)"
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        echo "✅ Node killed (PID: $PID)"
    else
        echo "ℹ️ No Node process found on port 5173"
    fi
}

killallport() {
    ports=(3000 5173 8000 8080 5000)
    for p in "${ports[@]}"; do
        if lsof -ti tcp:$p >/dev/null 2>&1; then
            local PID
            PID="$(lsof -ti tcp:$p)"
            kill -9 $PID 2>/dev/null || true
            echo "✅ Killed port $p (PID: $PID)"
        fi
    done
}

# -------- Comprehensive Start Functions --------
start_django() {
    local BACKEND_DIR=""
    local MYSITE_DIR=""
    
    # Detect Django project
    if [ -d "Backend/backend/mysite" ]; then
        BACKEND_DIR="Backend/backend"
        MYSITE_DIR="Backend/backend/mysite"
    elif [ -d "Backend/mysite" ]; then
        BACKEND_DIR="Backend"
        MYSITE_DIR="Backend/mysite"
    elif [ -d "backend/mysite" ]; then
        BACKEND_DIR="backend"
        MYSITE_DIR="backend/mysite"
    fi

    if [ -z "$MYSITE_DIR" ]; then
        echo "❌ Django project not found!"
        echo "   Expected: Backend/mysite or backend/mysite"
        return 1
    fi

    echo "🚀 Starting Django backend..."
    
    # Kill existing Django
    kill_django
    
    pushd "$BACKEND_DIR" >/dev/null

    # Handle virtual environment
    if [ -d "env" ]; then
        echo "🗑️ Removing existing env..."
        rm -rf env
    fi
    
    echo "🐍 Creating python venv (env)..."
    python3 -m venv env
    source env/bin/activate
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        echo "📦 Installing requirements..."
        pip install -r requirements.txt
    else
        echo "📦 Installing Django..."
        pip install django djangorestframework django-cors-headers
    fi

    cd "$(basename "$MYSITE_DIR")"

    # Fix DEFAULT_AUTO_FIELD if settings.py exists
    if [ -f "settings.py" ] && ! grep -q "DEFAULT_AUTO_FIELD" settings.py; then
        echo "🔧 Fixing Django auto field..."
        echo "" >> settings.py
        echo "DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'" >> settings.py
    fi

    # Run migrations
    echo "🔄 Running migrations..."
    python3 manage.py makemigrations 2>/dev/null || true
    python3 manage.py migrate 2>&1 | grep -v "WARNINGS" || true
    
    # Create superuser
    echo "👤 Creating superuser..."
    python3 manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
try:
    User.objects.create_superuser('su', 'su@gmail.com', 'su')
    print('✅ Superuser created')
except:
    try:
        user = User.objects.get(username='su')
        user.set_password('su')
        user.save()
        print('✅ Superuser updated')
    except:
        print('⚠️ Could not create/update superuser')
" 2>/dev/null || true

    # Start Django server
    echo "🌐 Starting Django server..."
    nohup python3 manage.py runserver 0.0.0.0:8000 > /tmp/django.log 2>&1 &
    local DJANGO_PID=$!
    
    sleep 2
    if ps -p $DJANGO_PID > /dev/null 2>&1; then
        echo "✅ Django running: http://127.0.0.1:8000"
        echo "   Admin: http://127.0.0.1:8000/admin"
        echo "   User: su / Pass: su"
        echo "   Logs: /tmp/django.log"
    else
        echo "❌ Django failed to start"
        tail -10 /tmp/django.log
    fi

    popd >/dev/null
    return 0
}

start_node() {
    local FRONTEND_DIR=""
    
    # Detect Node project
    if [ -d "Frontend" ] && [ -f "Frontend/package.json" ]; then
        FRONTEND_DIR="Frontend"
    elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        FRONTEND_DIR="frontend"
    fi

    if [ -z "$FRONTEND_DIR" ]; then
        echo "❌ Node project not found!"
        echo "   Expected: Frontend/ or frontend/ with package.json"
        return 1
    fi

    echo "🚀 Starting Node frontend..."
    
    # Kill existing Node
    kill_node
    
    pushd "$FRONTEND_DIR" >/dev/null

    # Increase Node memory limit
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Install if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi

    # Start frontend
    echo "⚡ Starting Vite..."
    nohup npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/node.log 2>&1 &
    local NODE_PID=$!
    
    sleep 3
    if ps -p $NODE_PID > /dev/null 2>&1; then
        echo "✅ Frontend running: http://localhost:5173"
        echo "   Logs: /tmp/node.log"
        
        # Show Vite URLs after a moment
        sleep 1
        echo "🌍 Vite URLs:"
        tail -5 /tmp/node.log | grep -E "➜|Local:|Network:" | head -2 || true
    else
        echo "❌ Frontend failed to start"
        tail -10 /tmp/node.log
    fi

    popd >/dev/null
    return 0
}

# -------- Main Reset Function --------
reset_pydjno() {
    local BACKEND_DIR=""
    local MYSITE_DIR=""
    local FRONTEND_DIR=""
    
    # Detect projects
    if [ -d "Backend/backend/mysite" ]; then
        BACKEND_DIR="Backend/backend"
        MYSITE_DIR="Backend/backend/mysite"
    elif [ -d "Backend/mysite" ]; then
        BACKEND_DIR="Backend"
        MYSITE_DIR="Backend/mysite"
    elif [ -d "backend/mysite" ]; then
        BACKEND_DIR="backend"
        MYSITE_DIR="backend/mysite"
    fi

    if [ -d "Frontend" ] && [ -f "Frontend/package.json" ]; then
        FRONTEND_DIR="Frontend"
    elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        FRONTEND_DIR="frontend"
    fi

    if [ -z "$MYSITE_DIR" ] && [ -z "$FRONTEND_DIR" ]; then
        echo "❌ No projects found!"
        echo "   Expected Django: Backend/mysite"
        echo "   Expected Node: frontend/ with package.json"
        return 1
    fi

    echo
    echo "📁 Project detected:"
    [ -n "$MYSITE_DIR" ] && echo "   🐍 Django: $MYSITE_DIR"
    [ -n "$FRONTEND_DIR" ] && echo "   ⚡ Node: $FRONTEND_DIR"
    echo

    echo "Choose what to reset:"
    echo "1) Backend (Django)"
    echo "2) Frontend (Node)"
    echo "3) Both (Django + Node)"
    echo
    
    read -r -p "Enter choice (1/2/3): " CH
    
    echo
    echo "════════════════════════════════════════════════════════════"

    case "$CH" in
        1)
            start_django
            ;;
        2)
            start_node
            ;;
        3)
            start_django
            if [ $? -eq 0 ]; then
                echo
                echo "⏳ Waiting for Django..."
                sleep 2
            fi
            start_node
            ;;
        *)
            echo "❌ Invalid choice!"
            return 1
            ;;
    esac

    echo
    echo "════════════════════════════════════════════════════════════"
    echo "✅ Reset complete! Servers are running in background."
    echo
    echo "🛑 To stop servers:"
    echo "   ./start.sh kill      # Stop both"
    echo "   ./start.sh kill django  # Stop Django only"
    echo "   ./start.sh kill node    # Stop Node only"
    echo "   ./start.sh kill ports   # Kill all dev ports"
    echo
    echo "🌐 URLs:"
    [ -n "$MYSITE_DIR" ] && echo "   Django: http://127.0.0.1:8000"
    [ -n "$MYSITE_DIR" ] && echo "   Admin:  http://127.0.0.1:8000/admin (su/su)"
    [ -n "$FRONTEND_DIR" ] && echo "   Frontend: http://localhost:5173"
    echo
}

# Run the reset function
reset_pydjno
EOF

chmod +x reset.sh
echo "✅ Created reset.sh"

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📋 Created files:"
echo "  • start.sh  - Start servers (with kill options)"
echo "  • reset.sh  - Reset environment and start servers"
echo ""
echo "🚀 Quick Start:"
echo "  ./reset.sh                   # Full reset & start"
echo "  ./start.sh                   # Start both servers"
echo "  ./start.sh django            # Start Django only"
echo "  ./start.sh node              # Start Node only"
echo "  ./start.sh kill              # Stop both servers"
echo "  ./start.sh kill django       # Stop Django only"
echo "  ./start.sh kill node         # Stop Node only"
echo "  ./start.sh kill ports        # Kill all dev ports"
echo ""