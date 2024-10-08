const express = require('express');
const path = require('path');
const {open} = require('sqlite');
const sqlite3 = require('sqlite3');
const cors = require('cors');

const dbPath = path.join(__dirname, 'data.db');
const app = express();
const port = process.env.PORT || 3005;

app.use(express.json());
app.use(cors());
 
let dataBase = null;

const initializeDBAndServer = async () => {
  try {
    dataBase = await open({filename: dbPath, driver: sqlite3.Database});
    app.listen(port, () => {
      console.log(`Server Running at ${port}`)
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
}
initializeDBAndServer();


//GET Post API
app.get('/post/', async (req, res) => {
    const postQuery = `SELECT * FROM post;`

    // const postList = await dataBase.get(postQuery);
    // res.send(postList);

    try {
        const postList = await dataBase.get(postQuery);
        
        // Check if there are no posts and return an appropriate message
        if (postList.length === 0) {
            return res.status(404).send({ message: "No posts found." });
        }

        res.send(postList);
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).send({ message: "Error fetching posts." });
    }
});

//GET Posts API
app.get('/posts/', async (req, res) => {
    const getPostsQuery = `SELECT * FROM post;`

    // const postList = await dataBase.all(getPostsQuery);
    // res.send(postList);

    try {
        const postList = await dataBase.all(getPostsQuery);
        
        // Check if there are no posts and return an appropriate message
        if (postList.length === 0) {
            return res.status(404).send({ message: "No posts found." });
        }

        res.send(postList);
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).send({ message: "Error fetching posts." });
    }
});

//GET post with ID API
app.get('/post/:userId', async (req, res) => {
    const { userId } = req.params;
    const getPostQuery = `SELECT * FROM post WHERE user_id = ?;`;
    // const singlePostList = await dataBase.get(getPostQuery);
    // res.send(singlePostList);

    try {
        const singlePost = await dataBase.get(getPostQuery, userId);

        if (!singlePost) {
            return res.status(404).send("Post not found."); // Return 404 if no post is found
        }

        res.send(singlePost);
    } catch (error) {
        console.error('Error fetching post:', error.message);
        res.status(500).send("Error retrieving post.");
    }
});

//POST API
app.post('/post/', async (req, res) => {
    const { postTitle, postContent } = req.body;
 
     try {
         // Step 1: Get the maximum user_id from the post table
         const getMaxUserIdQuery = `SELECT MAX(user_id) AS lastUserId FROM post;`;
         const maxIdResult = await dataBase.get(getMaxUserIdQuery);
 
         // Step 2: Determine the new user_id (increment by 1)
         const newUserId = maxIdResult && maxIdResult.lastUserId ? maxIdResult.lastUserId + 1 : 1;
 
         // Step 3: Insert the new post with the incremented user_id, post_title, and post_content
         const addPostQuery = `
         INSERT INTO 
             post (user_id, post_title, post_content)
         VALUES (
             ${newUserId},
             '${postTitle}',  -- Add comma here
             '${postContent}'
         );`;
 
         await dataBase.run(addPostQuery);
 
         res.send(`Post successfully added.`);
     } catch (e) { 
         console.error(e.message);
         res.status(500).send('Error adding post.');
     }
 });
 

//PUT API
app.put('/post/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { postTitle, postContent } = req.body;
    const updatePostQuery = `
            UPDATE
                post
            SET
                post_title = ?,
                post_content = ?
            WHERE
                user_id = ?;`;

    // await dataBase.run(updatePostQuery);
    // res.send("Post Updated Successfully.")

    try {
        const result = await dataBase.run(updatePostQuery, postTitle, postContent, userId);
        
        if (result.changes === 0) {
            return res.status(404).send("Post not found."); // Return 404 if no rows were updated
        }
        
        res.send("Post Updated Successfully.");
    } catch (error) {
        console.error('Error updating post:', error.message);
        res.status(500).send("Error updating post.");
    }
});

//DELETE API
app.delete('/post/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    const deletePostQuery = `
            DELETE FROM post
            WHERE user_id = ?;`;
    // await dataBase.run(deletePostQuery);
    // res.send("Post Deleted Successfully");

    try {
        const result = await dataBase.run(deletePostQuery, userId);
        
        if (result.changes === 0) {
            return res.status(404).send("Post not found."); // Return 404 if no rows were deleted
        }

        res.send("Post Deleted Successfully");
    } catch (error) {
        console.error('Error deleting post:', error.message);
        res.status(500).send("Error deleting post.");
    }
});

module.exports = app;
