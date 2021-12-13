set "dir=C:\Users\mitch\Documents\GitHub\tokyo-listings\"

cd "%dir%tokyo-listings-server"

start cmd /K "npm start"

cd "%dir%tokyo-listings-frontend"

start cmd /K "npm start"