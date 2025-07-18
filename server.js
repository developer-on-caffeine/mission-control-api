const express = require('express')
const nodejsondb = require('node-json-db')
const app = express()
const port = 8080
const cors = require('cors');

app.use(express.json());


app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true 
}));

const JsonDB = nodejsondb.JsonDB
const JsonConfig = nodejsondb.Config

var pagesdb = new JsonDB(new JsonConfig("app/database/pagesDB",true,false,"/"))

app.get('/', (req, res) => {
  res.send('mission control api')
})

app.get('/pages', async (req, res) => {
  try {
    const data = await pagesdb.getData("/");
    res.json(data);
  } catch (error){
    console.error('Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
})

app.post('/addcategory', async (req, res) => {
  const { name, color, pages } = req.body;
  if (!name || !color) {
    return res.status(400).json({ error: 'Name and color are required.' });
  }
  try {
    const categories = await pagesdb.getData('/');
    const keys = Object.keys(categories);

    const exists = Object.entries(categories).some(([key, value]) => {
      value.name.toLowerCase() === name.toLowerCase()
    })
    if (!exists) {
      const id = keys.length > 0 ? (keys[keys.length - 1] * 1) + 1 : 0;
      await pagesdb.push(`/${id}`, { name, color, pages });
      console.log('Saved:', { name, color, pages });
      res.status(201).json({ message: 'Category added successfully', id });
    }
  } catch (error) {
    console.error('Error saving category:', error);
    res.status(500).json({ error: 'Failed to save category.' });
  }
})

app.post('/addpage', async (req, res) => {
  const { name, category, url, target } = req.body;
  if (!name || !category || !url || !target) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pages = await pagesdb.getData(`/${category}/pages/`);
    const keys = Object.keys(pages);

    const exists = Object.entries(pages).some(([key, value]) => {
      value.name.toLowerCase() === name.toLowerCase() || value.url.toLowerCase() === url.toLowerCase()
    })
    if(!exists){
      const id = keys.length > 0 ? (keys[keys.length - 1] * 1) + 1 : 0;
      const newPage = { name: name, url, target };
      await pagesdb.push(`/${category}/pages/${id}`, newPage);
      res.status(201).json({ message: 'Page added successfully', id });
    }
  } catch (error) {
    console.error('Error saving page:', error);
    res.status(500).json({ error: 'Failed to save page.' });
  }
})

app.put('/categories/:id', async (req, res) => {
  const categoryId = req.params.id;
  const { name, color } = req.body;
  console.log(name, color)

  if(!name || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const exists = await pagesdb.exists(`/${categoryId}`);

    if(!exists){
      return res.status(404).json({ error: `Category '${categoryId}' not found.` });
    }

    await pagesdb.push(`/${categoryId}/name`, name);
    await pagesdb.push(`/${categoryId}/color`, color); 
    
    res.status(200).json({ message: `Category '${categoryId}' updated.` });

  } catch (error){
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
})

app.put('/pages/:catid/:pageid', async (req, res) => {
  const categoryId = req.params.catid;
  const pageId = req.params.pageid;
  const {name, url, target} = req.body;

  if(!name || !url || !target) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const exists = await pagesdb.exists(`/${categoryId}/pages/${pageId}`)
    if(!exists){
      return res.status(404).json({ error: `Page '${pageId}' not found.` });
    }
    await pagesdb.push(`/${categoryId}/pages/${pageId}/name`, name);
    await pagesdb.push(`/${categoryId}/pages/${pageId}/url`, url);
    await pagesdb.push(`/${categoryId}/pages/${pageId}/target`, target);

    res.status(200).json({ message: `Page '${pageId}' updated.` });

  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page.' });
  
  }
})

app.delete('/deletepage/:categoryId/:id', async (req, res) => {
  const { categoryId, id } = req.params;
 
  try {
    const path = `/${categoryId}/pages/${id}`;
    const exists = await pagesdb.exists(path);

    if(!exists){
      return res.status(404).json({ error: 'Page not found.' });
    }

    await pagesdb.delete(path);
    return res.status(200).json({ message: `Page ${id} deleted from category ${categoryId}.` });
  } catch(error) {
    console.error('Error deleting page:', error);
    return res.status(500).json({ error: 'Internal server error.' })
  }

})

app.delete('/deletecategory/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id)
  try {
    const path = `/${id}`;
    const exists = await pagesdb.exists(path);

    if(!exists){
      return res.status(404).json({ error: 'Page not found.' });
    }

    await pagesdb.delete(path);
    return res.status(200).json({ message: `Category ${id} deleted from category ${id}.` });
  } catch(error) {
    console.error('Error deleting page:', error);
    return res.status(500).json({ error: 'Internal server error.' })
  }

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})