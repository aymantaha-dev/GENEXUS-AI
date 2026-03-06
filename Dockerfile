FROM node:18-alpine

WORKDIR /app

# نسخ ملفات التبعيات وتثبيتها
COPY package*.json ./
RUN npm install

# نسخ الكود
COPY . .

# إنشاء مجلد uploads
RUN mkdir -p /app/uploads && \
    chown -R node:node /app && \
    chmod -R 755 /app

USER node

EXPOSE 3000

CMD ["node", "src/app.js"]
