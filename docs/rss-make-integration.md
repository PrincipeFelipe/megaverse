# RSS Feed del Blog - Integración con Make

## 📋 Resumen

Se ha implementado un feed RSS completo para el blog de MEGAVERSE que puede ser utilizado con Make (anteriormente Integromat) para crear automatizaciones.

## 🔗 URLs del RSS

- **Principal**: `http://localhost:8090/api/rss/blog`
- **Alternativa**: `http://localhost:8090/api/rss/blog.xml`
- **Página de información**: `http://localhost:3000/rss`

## 📊 Características del Feed

### Formato y Especificaciones
- **Formato**: RSS 2.0
- **Codificación**: UTF-8
- **Límite**: 20 artículos más recientes
- **Ordenación**: Por fecha (más reciente primero)
- **Filtrado**: Solo posts con status "published"
- **Cache**: 1 hora

### Campos Incluidos en Cada Item
- **Título**: Título del artículo
- **Enlace**: URL permanente del post
- **GUID**: Identificador único (mismo que el enlace)
- **Descripción**: Resumen del artículo
- **Fecha de publicación**: Formato RFC 2822
- **Autor**: Email y nombre del autor
- **Categoría**: Categoría principal del post
- **Etiquetas**: Tags adicionales como categorías múltiples

## 🤖 Integración con Make

### 1. Configuración Básica

1. **Crear un nuevo escenario** en Make
2. **Añadir módulo RSS**:
   - Buscar "RSS" en la lista de módulos
   - Seleccionar "Watch RSS feed items"
3. **Configurar el módulo**:
   - **URL**: `http://localhost:8090/api/rss/blog`
   - **Frecuencia**: Cada 15 minutos (recomendado)
   - **Límite**: 10 elementos por ejecución

### 2. Escenarios de Automatización

#### A. Publicación en Redes Sociales
```
RSS Watch → Twitter/X → Publicar tweet
RSS Watch → Facebook → Crear post
RSS Watch → LinkedIn → Publicar actualización
```

#### B. Notificaciones por Email
```
RSS Watch → Gmail → Enviar email
RSS Watch → Mailchimp → Añadir a campaña
```

#### C. Notificaciones en Chat
```
RSS Watch → Discord → Enviar mensaje
RSS Watch → Slack → Publicar en canal
RSS Watch → Telegram → Enviar mensaje
```

#### D. Sincronización con CMS
```
RSS Watch → WordPress → Crear post
RSS Watch → Notion → Crear página
RSS Watch → Airtable → Crear registro
```

### 3. Campos Disponibles para Automatización

Cuando configures las acciones en Make, tendrás acceso a estos campos:

- `title`: Título del artículo
- `link`: URL del artículo completo
- `guid`: Identificador único
- `description`: Resumen del contenido
- `pubDate`: Fecha de publicación
- `author`: Autor del artículo
- `category`: Categoría principal
- `categories`: Array de todas las categorías/tags

### 4. Ejemplos de Filtros

#### Filtrar por Categoría
```javascript
// En el filtro de Make
{{item.category}} == "Warhammer 40k"
```

#### Filtrar por Fecha
```javascript
// Solo posts de los últimos 7 días
{{formatDate(item.pubDate; "YYYY-MM-DD")}} >= {{formatDate(addDays(now; -7); "YYYY-MM-DD")}}
```

#### Filtrar por Tags
```javascript
// Si contiene cierta etiqueta
{{contains(item.categories; "torneo")}}
```

### 5. Plantillas de Mensajes

#### Para Twitter/X
```
🎲 Nuevo artículo en MEGAVERSE:
{{item.title}}

{{item.description}}

👉 {{item.link}}

#MEGAVERSE #JuegosDeMesa #Gaming
```

#### Para Discord
```
📰 **Nuevo Post en el Blog**

**{{item.title}}**
{{item.description}}

🔗 [Leer más]({{item.link}})
📅 {{formatDate(item.pubDate; "DD/MM/YYYY")}}
👤 Por {{item.author}}
```

#### Para Email
```
Asunto: Nuevo artículo: {{item.title}}

Cuerpo:
Hola!

Hay un nuevo artículo en el blog de MEGAVERSE:

Título: {{item.title}}
Fecha: {{formatDate(item.pubDate; "DD/MM/YYYY")}}
Autor: {{item.author}}

{{item.description}}

Lee el artículo completo aquí: {{item.link}}

¡Saludos desde MEGAVERSE!
```

## 🛠️ Características Técnicas

### Headers HTTP
- `Content-Type`: `application/rss+xml; charset=utf-8`
- `Cache-Control`: `public, max-age=3600`
- Sin autenticación requerida

### Formato XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MEGAVERSE - Blog</title>
    <description>Últimas noticias y artículos sobre juegos de mesa, wargames y Warhammer 40.000</description>
    <link>http://localhost:3000/blog</link>
    <language>es-ES</language>
    <lastBuildDate>Wed, 09 Jul 2025 13:53:48 GMT</lastBuildDate>
    <generator>MEGAVERSE RSS Generator</generator>
    <atom:link href="http://localhost:3000/api/rss/blog" rel="self" type="application/rss+xml"/>
    
    <item>
      <title>Título del Post</title>
      <link>http://localhost:3000/blog/slug-del-post</link>
      <guid isPermaLink="true">http://localhost:3000/blog/slug-del-post</guid>
      <description>Resumen del artículo</description>
      <pubDate>Wed, 09 Jul 2025 13:53:48 GMT</pubDate>
      <author>noreply@megaverse.es (Nombre del Autor)</author>
      <category>Categoría Principal</category>
      <category>Tag 1</category>
      <category>Tag 2</category>
    </item>
  </channel>
</rss>
```

## 🔧 Mantenimiento

### Monitoreo
- El feed incluye caché de 1 hora para optimizar rendimiento
- Se generan logs en el servidor para debugging
- El feed está disponible 24/7 sin autenticación

### Actualizaciones
- El feed se actualiza automáticamente cuando se publican nuevos posts
- No requiere mantenimiento manual
- Compatible con todos los lectores RSS estándar

## 📚 Recursos Adicionales

### Herramientas para Probar RSS
- **Online**: https://validator.w3.org/feed/
- **Navegador**: Directamente en la URL del RSS
- **Lectores RSS**: Feedly, Inoreader, etc.

### Documentación de Make
- **RSS Module**: https://www.make.com/en/help/modules/rss
- **Scenarios**: https://www.make.com/en/help/scenarios

## 🎯 Próximos Pasos

1. **Configurar el primer escenario** en Make
2. **Probar con un canal** de comunicación (Discord/Slack)
3. **Expandir a redes sociales** una vez validado
4. **Crear reportes** periódicos de actividad
5. **Implementar filtros** específicos por categorías

¡El RSS ya está listo para usar con Make y crear automatizaciones increíbles! 🚀
