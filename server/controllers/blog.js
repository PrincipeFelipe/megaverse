import { pool } from '../config/database.js';
import slugify from 'slugify';
// La importación del servicio de redes sociales ha sido eliminada

/**
 * Controlador para la gestión de posts del blog
 */
export const blogPostsController = {
  /**
   * Obtener todos los posts del blog con filtros opcionales
   */
  getAllPosts: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Extraer filtros de la consulta
      const {
        category,
        tag,
        author_id,
        search,
        status, // Quitamos el valor por defecto para mostrar todos los estados
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;
      
      // Log para depuración
      console.log('getAllPosts - Filtros recibidos:', {
        status,
        category,
        tag,
        author_id,
        search,
        page,
        limit
      });
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Base de la consulta
      let query = `
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.content,
          p.excerpt, 
          p.image_url, 
          p.author_id,
          p.featured,
          LOWER(p.status) as status, -- Convertirlo a minúsculas para consistencia
          p.created_at, 
          p.updated_at,
          u.username as author_name,
          c.id as category_id,
          c.name as category,
          (SELECT COUNT(*) FROM blog_comments WHERE post_id = p.id AND status = 'approved') as comments_count
        FROM 
          blog_posts p
        JOIN 
          users u ON p.author_id = u.id
        JOIN 
          blog_categories c ON p.category_id = c.id
        WHERE 
          1=1
      `;
      
      // Parámetros para consulta preparada
      const queryParams = [];
      
      // Filtrar por estado (publicado/borrador)
      if (status) {
        console.log('Filtrando por status:', status);
        
        // Asegurar que el status sea minúsculas para consistencia
        const statusLower = String(status).toLowerCase();
        console.log('Status convertido a minúsculas:', statusLower);
        
        // Usar LOWER en ambos lados para asegurar la comparación correcta
        query += " AND LOWER(p.status) = LOWER(?)";
        queryParams.push(statusLower);
        
        // Log adicional para debugging
        console.log('Consulta SQL con filtro de status:', query);
        console.log('Valor del parámetro status:', statusLower);
      } else {
        console.log('No se está filtrando por status');
      }
      
      // Filtrar por categoría
      if (category) {
        query += " AND c.slug = ?";
        queryParams.push(category);
      }
      
      // Filtrar por tag
      if (tag) {
        query += `
          AND p.id IN (
            SELECT pt.post_id 
            FROM blog_posts_tags pt 
            JOIN blog_tags t ON pt.tag_id = t.id 
            WHERE t.slug = ?
          )
        `;
        queryParams.push(tag);
      }
      
      // Filtrar por autor
      if (author_id) {
        query += " AND p.author_id = ?";
        queryParams.push(author_id);
      }
      
      // Búsqueda en título y contenido
      if (search) {
        query += " AND (p.title LIKE ? OR p.content LIKE ? OR p.excerpt LIKE ?)";
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Ordenamiento
      const validSortColumns = ['created_at', 'title', 'updated_at'];
      const validSortOrders = ['asc', 'desc'];
      
      const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
      const sortDir = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order.toLowerCase() : 'desc';
      
      query += ` ORDER BY p.${sortColumn} ${sortDir}`;
      
      // Paginación
      query += " LIMIT ? OFFSET ?";
      queryParams.push(Number(limit), Number(offset));
      
      // Log para mostrar la consulta SQL final
      console.log('Consulta SQL final:', query);
      console.log('Parámetros de la consulta:', queryParams);
      
      // Ejecutar consulta
      const [posts] = await connection.query(query, queryParams);
      
      // Log para mostrar los resultados
      console.log(`Encontrados ${posts.length} posts.`);
      // Mostrar los posts encontrados para depuración
      posts.forEach(post => {
        console.log(`Post ID: ${post.id}, Título: ${post.title}, Status: '${post.status}'`);
      });
      
      // Obtener los tags para cada post
      for (let post of posts) {
        const [tags] = await connection.query(`
          SELECT t.name, t.slug
          FROM blog_tags t
          JOIN blog_posts_tags pt ON t.id = pt.tag_id
          WHERE pt.post_id = ?
        `, [post.id]);
        
        post.tags = tags.map(tag => tag.name);
      }
      
      // Contar total de posts para metadata de paginación
      let countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM blog_posts p
        JOIN users u ON p.author_id = u.id
        JOIN blog_categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      
      // Reutilizamos los mismos filtros para el conteo
      const countParams = [...queryParams];
      // Eliminar los parámetros de limit y offset
      countParams.splice(-2, 2);
      
      const [totalResults] = await connection.query(countQuery, countParams);
      const total = totalResults[0].total;
      
      res.json({
        posts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error al obtener posts del blog:', error);
      res.status(500).json({ message: 'Error al obtener posts del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Obtener un post del blog por ID
   */
  getPostById: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { id } = req.params;
      
      // Consultar el post
      const [posts] = await connection.query(`
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.content,
          p.excerpt, 
          p.image_url, 
          p.author_id,
          p.featured,
          LOWER(p.status) as status, -- Convertirlo a minúsculas para consistencia
          p.created_at, 
          p.updated_at,
          u.username as author_name,
          c.id as category_id,
          c.name as category,
          c.slug as category_slug
        FROM 
          blog_posts p
        JOIN 
          users u ON p.author_id = u.id
        JOIN 
          blog_categories c ON p.category_id = c.id
        WHERE 
          p.id = ?
      `, [id]);
      
      if (posts.length === 0) {
        return res.status(404).json({ message: 'Post no encontrado' });
      }
      
      const post = posts[0];
      
      // Obtener tags del post
      const [tags] = await connection.query(`
        SELECT t.id, t.name, t.slug
        FROM blog_tags t
        JOIN blog_posts_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [id]);
      
      post.tags = tags;
      
      res.json({ post });
    } catch (error) {
      console.error('Error al obtener post por ID:', error);
      res.status(500).json({ message: 'Error al obtener post del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Obtener un post del blog por su slug
   */
  getPostBySlug: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { slug } = req.params;
      const { publicOnly } = req.query;
      
      // Construir la consulta
      let query = `
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.content,
          p.excerpt, 
          p.image_url, 
          p.author_id,
          p.featured,
          LOWER(p.status) as status, -- Convertirlo a minúsculas para consistencia 
          p.created_at, 
          p.updated_at,
          u.username as author_name,
          c.id as category_id,
          c.name as category,
          c.slug as category_slug
        FROM 
          blog_posts p
        JOIN 
          users u ON p.author_id = u.id
        JOIN 
          blog_categories c ON p.category_id = c.id
        WHERE 
          p.slug = ?
      `;
      
      const queryParams = [slug];
      
      // Si es una solicitud pública, solo mostrar posts publicados
      if (publicOnly === 'true') {
        query += " AND LOWER(p.status) = 'published'";
      }
      
      // Ejecutar la consulta
      const [posts] = await connection.query(query, queryParams);
      
      if (posts.length === 0) {
        return res.status(404).json({ message: 'Post no encontrado' });
      }
      
      const post = posts[0];
      
      // Obtener tags del post
      const [tags] = await connection.query(`
        SELECT t.id, t.name, t.slug
        FROM blog_tags t
        JOIN blog_posts_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [post.id]);
      
      post.tags = tags;
      
      res.json({ post });
    } catch (error) {
      console.error('Error al obtener post por slug:', error);
      res.status(500).json({ message: 'Error al obtener post del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Crear un nuevo post en el blog
   */
  createPost: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      // Extraer datos del request
      const { 
        title, 
        content,
        excerpt, 
        image_url, 
        category_id,
        tags,
        status = 'draft',
        featured = false,
        // Nuevos campos para redes sociales
        socialMedia = []
      } = req.body;
      
      // Validaciones básicas
      if (!title || !content || !category_id) {
        return res.status(400).json({ 
          message: 'Faltan campos obligatorios (título, contenido, categoría)' 
        });
      }
      
      // Crear slug a partir del título
      let slug = slugify(title, { 
        lower: true,
        strict: true,
        locale: 'es'
      });
      
      // Verificar si el slug ya existe
      const [existingSlugs] = await connection.query(
        'SELECT slug FROM blog_posts WHERE slug = ? OR slug LIKE ?', 
        [slug, `${slug}-%`]
      );
      
      // Si ya existe, añadir sufijo numérico
      if (existingSlugs.length > 0) {
        slug = `${slug}-${existingSlugs.length + 1}`;
      }
      
      // Crear el post
      const [result] = await connection.query(`
        INSERT INTO blog_posts (
          title, 
          slug, 
          content, 
          excerpt, 
          image_url, 
          author_id, 
          category_id,
          status,
          featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title, 
        slug, 
        content, 
        excerpt || content.substring(0, 200) + '...', 
        image_url || null, 
        req.user.id, 
        category_id,
        status,
        featured
      ]);
      
      const postId = result.insertId;
      
      // Si hay tags, insertarlos en la tabla pivote
      if (tags && tags.length > 0) {
        const tagValues = [];
        const tagParams = [];
        
        // Procesar cada tag
        for (const tagId of tags) {
          tagValues.push('(?, ?)');
          tagParams.push(postId, tagId);
        }
        
        // Insertar en la tabla pivote
        await connection.query(`
          INSERT INTO blog_posts_tags (post_id, tag_id)
          VALUES ${tagValues.join(', ')}
        `, tagParams);
      }
      
      await connection.commit();
      
      // Obtener el post completo para devolverlo en la respuesta
      const [posts] = await connection.query(`
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.excerpt, 
          p.content,
          p.image_url, 
          p.author_id,
          p.featured,
          p.status,
          p.created_at, 
          p.updated_at,
          u.username as author_name,
          c.name as category
        FROM 
          blog_posts p
        JOIN 
          users u ON p.author_id = u.id
        JOIN 
          blog_categories c ON p.category_id = c.id
        WHERE 
          p.id = ?
      `, [postId]);
      
      const post = posts[0];
      
      // Obtener tags del post
      const [postTags] = await connection.query(`
        SELECT t.id, t.name, t.slug
        FROM blog_tags t
        JOIN blog_posts_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [postId]);
      
      post.tags = postTags;
      
      // La lógica de publicación en redes sociales ha sido eliminada
      
      res.status(201).json({ 
        message: 'Post creado exitosamente',
        post
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al crear post del blog:', error);
      res.status(500).json({ message: 'Error al crear el post del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Actualizar un post existente
   */
  updatePost: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { 
        title, 
        content,
        excerpt, 
        image_url, 
        category_id,
        tags,
        status,
        featured,
        // Nuevos campos para redes sociales
        socialMedia = []
      } = req.body;
      
      // Verificar que el post existe
      const [posts] = await connection.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
      
      if (posts.length === 0) {
        return res.status(404).json({ message: 'Post no encontrado' });
      }
      
      // Verificar propiedad o rol de admin
      const post = posts[0];
      if (post.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No tienes permiso para editar este post' });
      }
      
      // Guardar el estado anterior para saber si el post se está publicando ahora
      const previousStatus = post.status;
      const isNewlyPublished = previousStatus !== 'published' && status === 'published';
      
      // Actualizar slug si cambió el título
      let slug = post.slug;
      if (title && title !== post.title) {
        slug = slugify(title, { 
          lower: true, 
          strict: true,
          locale: 'es'
        });
        
        // Verificar si el nuevo slug ya existe
        const [existingSlugs] = await connection.query(
          'SELECT slug FROM blog_posts WHERE slug = ? AND id != ?', 
          [slug, id]
        );
        
        // Si ya existe, añadir sufijo numérico
        if (existingSlugs.length > 0) {
          slug = `${slug}-${existingSlugs.length + 1}`;
        }
      }
      
      // Construir consulta de actualización dinámica
      const updateFields = [];
      const updateValues = [];
      
      if (title) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      
      if (slug !== post.slug) {
        updateFields.push('slug = ?');
        updateValues.push(slug);
      }
      
      if (content) {
        updateFields.push('content = ?');
        updateValues.push(content);
      }
      
      if (excerpt !== undefined) {
        updateFields.push('excerpt = ?');
        updateValues.push(excerpt || (content ? content.substring(0, 200) + '...' : post.excerpt));
      }
      
      if (image_url !== undefined) {
        updateFields.push('image_url = ?');
        updateValues.push(image_url);
      }
      
      if (category_id) {
        updateFields.push('category_id = ?');
        updateValues.push(category_id);
      }
      
      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }
      
      if (featured !== undefined) {
        updateFields.push('featured = ?');
        updateValues.push(featured);
      }
      
      // Si hay campos para actualizar
      if (updateFields.length > 0) {
        updateValues.push(id);
        
        await connection.query(`
          UPDATE blog_posts
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
      }
      
      // Actualizar tags si se proporcionaron
      if (tags && Array.isArray(tags)) {
        // Eliminar relaciones existentes
        await connection.query('DELETE FROM blog_posts_tags WHERE post_id = ?', [id]);
        
        // Insertar nuevos tags
        if (tags.length > 0) {
          const tagValues = [];
          const tagParams = [];
          
          for (const tagId of tags) {
            tagValues.push('(?, ?)');
            tagParams.push(id, tagId);
          }
          
          await connection.query(`
            INSERT INTO blog_posts_tags (post_id, tag_id)
            VALUES ${tagValues.join(', ')}
          `, tagParams);
        }
      }
      
      await connection.commit();
      
      // Obtener post actualizado
      const [updatedPosts] = await connection.query(`
        SELECT 
          p.id, 
          p.title, 
          p.slug, 
          p.excerpt, 
          p.content,
          p.image_url, 
          p.author_id,
          p.featured,
          p.status,
          p.created_at, 
          p.updated_at,
          u.username as author_name,
          c.name as category
        FROM 
          blog_posts p
        JOIN 
          users u ON p.author_id = u.id
        JOIN 
          blog_categories c ON p.category_id = c.id
        WHERE 
          p.id = ?
      `, [id]);
      
      const updatedPost = updatedPosts[0];
      
      // Obtener tags actualizados
      const [updatedTags] = await connection.query(`
        SELECT t.id, t.name, t.slug
        FROM blog_tags t
        JOIN blog_posts_tags pt ON t.id = pt.tag_id
        WHERE pt.post_id = ?
      `, [id]);
      
      updatedPost.tags = updatedTags;
      
      // La lógica de publicación en redes sociales ha sido eliminada
      
      res.json({ 
        message: 'Post actualizado exitosamente',
        post: updatedPost
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Error al actualizar post del blog:', error);
      res.status(500).json({ message: 'Error al actualizar el post del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Eliminar un post del blog
   */
  deletePost: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const { id } = req.params;
      
      // Verificar que el post existe
      const [posts] = await connection.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
      
      if (posts.length === 0) {
        return res.status(404).json({ message: 'Post no encontrado' });
      }
      
      // Verificar propiedad o rol de admin
      const post = posts[0];
      if (post.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este post' });
      }
      
      // Eliminar post (las relaciones se eliminarán por las restricciones de clave foránea)
      await connection.query('DELETE FROM blog_posts WHERE id = ?', [id]);
      
      res.json({ message: 'Post eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar post del blog:', error);
      res.status(500).json({ message: 'Error al eliminar el post del blog' });
    } finally {
      if (connection) connection.release();
    }
  }
};

/**
 * Controlador para la gestión de categorías del blog
 */
export const blogCategoriesController = {
  /**
   * Obtener todas las categorías del blog
   */
  getAllCategories: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const [categories] = await connection.query(`
        SELECT 
          c.id, 
          c.name, 
          c.slug, 
          c.description,
          COUNT(p.id) as posts_count
        FROM 
          blog_categories c
        LEFT JOIN 
          blog_posts p ON c.id = p.category_id
        GROUP BY 
          c.id
        ORDER BY 
          c.name ASC
      `);
      
      res.json({ categories });
    } catch (error) {
      console.error('Error al obtener categorías del blog:', error);
      res.status(500).json({ message: 'Error al obtener categorías del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Crear una nueva categoría
   */
  createCategory: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { name, description } = req.body;
      
      // Validación
      if (!name) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
      }
      
      // Crear slug
      const slug = slugify(name, { 
        lower: true,
        strict: true,
        locale: 'es'
      });
      
      // Verificar que no exista una categoría con el mismo nombre o slug
      const [existingCategories] = await connection.query(
        'SELECT * FROM blog_categories WHERE name = ? OR slug = ?',
        [name, slug]
      );
      
      if (existingCategories.length > 0) {
        return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
      }
      
      // Insertar categoría
      const [result] = await connection.query(
        'INSERT INTO blog_categories (name, slug, description) VALUES (?, ?, ?)',
        [name, slug, description || null]
      );
      
      const categoryId = result.insertId;
      
      // Obtener categoría creada
      const [categories] = await connection.query(
        'SELECT id, name, slug, description FROM blog_categories WHERE id = ?',
        [categoryId]
      );
      
      res.status(201).json({ 
        message: 'Categoría creada exitosamente',
        category: categories[0]
      });
    } catch (error) {
      console.error('Error al crear categoría del blog:', error);
      res.status(500).json({ message: 'Error al crear categoría del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Actualizar una categoría existente
   */
  updateCategory: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Verificar que la categoría existe
      const [categories] = await connection.query(
        'SELECT * FROM blog_categories WHERE id = ?',
        [id]
      );
      
      if (categories.length === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      
      const category = categories[0];
      
      // Actualizar categoría
      const updates = {};
      
      if (name && name !== category.name) {
        updates.name = name;
        updates.slug = slugify(name, { 
          lower: true,
          strict: true,
          locale: 'es'
        });
        
        // Verificar que no exista otra categoría con el mismo nombre
        const [existingCategories] = await connection.query(
          'SELECT * FROM blog_categories WHERE (name = ? OR slug = ?) AND id != ?',
          [name, updates.slug, id]
        );
        
        if (existingCategories.length > 0) {
          return res.status(400).json({ message: 'Ya existe otra categoría con ese nombre' });
        }
      }
      
      if (description !== undefined) {
        updates.description = description;
      }
      
      // Si hay actualizaciones
      if (Object.keys(updates).length > 0) {
        const updateFields = Object.keys(updates).map(field => `${field} = ?`);
        const updateValues = Object.values(updates);
        updateValues.push(id);
        
        await connection.query(`
          UPDATE blog_categories
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
      }
      
      // Obtener categoría actualizada
      const [updatedCategories] = await connection.query(
        'SELECT id, name, slug, description FROM blog_categories WHERE id = ?',
        [id]
      );
      
      res.json({ 
        message: 'Categoría actualizada exitosamente',
        category: updatedCategories[0]
      });
    } catch (error) {
      console.error('Error al actualizar categoría del blog:', error);
      res.status(500).json({ message: 'Error al actualizar categoría del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Eliminar una categoría del blog
   */
  deleteCategory: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { id } = req.params;
      
      // Verificar que no hay posts usando esta categoría
      const [posts] = await connection.query(
        'SELECT COUNT(*) as count FROM blog_posts WHERE category_id = ?',
        [id]
      );
      
      if (posts[0].count > 0) {
        return res.status(400).json({ 
          message: 'No se puede eliminar la categoría porque tiene posts asociados'
        });
      }
      
      // Eliminar categoría
      await connection.query('DELETE FROM blog_categories WHERE id = ?', [id]);
      
      res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar categoría del blog:', error);
      res.status(500).json({ message: 'Error al eliminar categoría del blog' });
    } finally {
      if (connection) connection.release();
    }
  }
};

/**
 * Controlador para la gestión de tags del blog
 */
export const blogTagsController = {
  /**
   * Obtener todos los tags del blog
   */
  getAllTags: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const [tags] = await connection.query(`
        SELECT 
          t.id, 
          t.name, 
          t.slug,
          COUNT(pt.post_id) as posts_count
        FROM 
          blog_tags t
        LEFT JOIN 
          blog_posts_tags pt ON t.id = pt.tag_id
        GROUP BY 
          t.id
        ORDER BY 
          t.name ASC
      `);
      
      res.json({ tags });
    } catch (error) {
      console.error('Error al obtener tags del blog:', error);
      res.status(500).json({ message: 'Error al obtener tags del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Crear un nuevo tag
   */
  createTag: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { name } = req.body;
      
      // Validación
      if (!name) {
        return res.status(400).json({ message: 'El nombre del tag es obligatorio' });
      }
      
      // Crear slug
      const slug = slugify(name, { 
        lower: true,
        strict: true,
        locale: 'es'
      });
      
      // Verificar que no exista un tag con el mismo nombre o slug
      const [existingTags] = await connection.query(
        'SELECT * FROM blog_tags WHERE name = ? OR slug = ?',
        [name, slug]
      );
      
      if (existingTags.length > 0) {
        return res.status(400).json({ message: 'Ya existe un tag con ese nombre' });
      }
      
      // Insertar tag
      const [result] = await connection.query(
        'INSERT INTO blog_tags (name, slug) VALUES (?, ?)',
        [name, slug]
      );
      
      const tagId = result.insertId;
      
      // Obtener tag creado
      const [tags] = await connection.query(
        'SELECT id, name, slug FROM blog_tags WHERE id = ?',
        [tagId]
      );
      
      res.status(201).json({ 
        message: 'Tag creado exitosamente',
        tag: tags[0]
      });
    } catch (error) {
      console.error('Error al crear tag del blog:', error);
      res.status(500).json({ message: 'Error al crear tag del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Actualizar un tag existente
   */
  updateTag: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { id } = req.params;
      const { name } = req.body;
      
      // Validación
      if (!name) {
        return res.status(400).json({ message: 'El nombre del tag es obligatorio' });
      }
      
      // Verificar que el tag existe
      const [tags] = await connection.query(
        'SELECT * FROM blog_tags WHERE id = ?',
        [id]
      );
      
      if (tags.length === 0) {
        return res.status(404).json({ message: 'Tag no encontrado' });
      }
      
      // Crear slug
      const slug = slugify(name, { 
        lower: true,
        strict: true,
        locale: 'es'
      });
      
      // Verificar que no exista otro tag con el mismo nombre
      const [existingTags] = await connection.query(
        'SELECT * FROM blog_tags WHERE (name = ? OR slug = ?) AND id != ?',
        [name, slug, id]
      );
      
      if (existingTags.length > 0) {
        return res.status(400).json({ message: 'Ya existe otro tag con ese nombre' });
      }
      
      // Actualizar tag
      await connection.query(
        'UPDATE blog_tags SET name = ?, slug = ? WHERE id = ?',
        [name, slug, id]
      );
      
      // Obtener tag actualizado
      const [updatedTags] = await connection.query(
        'SELECT id, name, slug FROM blog_tags WHERE id = ?',
        [id]
      );
      
      res.json({ 
        message: 'Tag actualizado exitosamente',
        tag: updatedTags[0]
      });
    } catch (error) {
      console.error('Error al actualizar tag del blog:', error);
      res.status(500).json({ message: 'Error al actualizar tag del blog' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  /**
   * Eliminar un tag del blog
   */
  deleteTag: async (req, res) => {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const { id } = req.params;
      
      // Eliminar relaciones con posts
      await connection.query('DELETE FROM blog_posts_tags WHERE tag_id = ?', [id]);
      
      // Eliminar tag
      await connection.query('DELETE FROM blog_tags WHERE id = ?', [id]);
      
      res.json({ message: 'Tag eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar tag del blog:', error);
      res.status(500).json({ message: 'Error al eliminar tag del blog' });
    } finally {
      if (connection) connection.release();
    }
  }
};

/**
 * El controlador de comentarios del blog ha sido eliminado
 */
