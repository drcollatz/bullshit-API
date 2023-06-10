const express = require('express');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bullshit API',
      version: '1.0.0',
      description: 'API documentation for the Bullshit Collection (in Notion)',
    },
  },
  apis: ['index.js'], // Specify the file(s) where your API routes are defined
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


/**
 * @swagger
 * /bullshit:
 *   post:
 *     summary: Create a new bullshit phrase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bs:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thank you for sponsoring bullshit successfully.
 *       500:
 *         description: Failed to create bullshit, sorry.
 */
app.post('/bullshit', async (req, res) => {
  try {
    const { bs, name } = req.body;
    const notionResponse = await axios.post(
      'https://api.notion.com/v1/pages',
      {
        parent: { database_id: NOTION_DATABASE_ID },
        icon: {
          type: 'emoji',
          emoji: '💩',
        },
        cover: {
          type: 'external',
          external: {
            url: 'https://cdn.pixabay.com/photo/2014/10/10/08/09/stamp-483015_1280.png',
          },
        },
        properties: {
          Spruch: {
            title: [
              {
                type: 'text',
                text: {
                  content: bs,
                },
              },
            ],
          },
          Author: {
            rich_text: [
              {
                text: {
                  content: name,
                },
              },
            ],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-02-22',
        },
      }
    );

    res.status(200).json(notionResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Notion page.' });
  }
});

/**
 * @swagger
 * /bullshit:
 *   get:
 *     summary: Get all of the bullshit.
 *     responses:
 *       200:
 *         description: bullshit retrieved successfully.
 *       500:
 *         description: Failed to retrieve bullshit.
 */
app.get('/bullshit', async (req, res) => {
  try {
    const notionResponse = await axios.post(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {},
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-02-22',
        },
      }
    );

    const pages = notionResponse.data.results.map((page) => {
      const spruch = page.properties.Spruch?.title[0]?.text?.content || '';
      const author = page.properties.Author?.rich_text[0]?.text?.content || '';
      
      return {
        spruch,
        author,
      };
    });

    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Notion pages.' });
  }
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
