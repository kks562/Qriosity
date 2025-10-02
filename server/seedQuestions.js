require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const connectDB = require('./config/db');
const Question = require('./models/Questions');
const User = require('./models/User');

connectDB();

async function seed() {
  try {
    // Optional: create a default user for authors
    let user = await User.findOne({ email: 'admin@example.com' });
    if (!user) {
      user = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashedpassword', // you can hash or leave blank for seed
      });
      await user.save();
    }

    console.log('Fetching questions from Stack Overflow...');
    // Fetch 100 questions (adjust pages to get 300)
    const { data } = await axios.get(
      'https://api.stackexchange.com/2.3/questions',
      {
        params: {
          pagesize: 100,
          order: 'desc',
          sort: 'activity',
          site: 'stackoverflow',
          filter: 'withbody', // include question body
        },
      }
    );

    for (const q of data.items) {
      // Fetch answers for each question
      const answersRes = await axios.get(
        `https://api.stackexchange.com/2.3/questions/${q.question_id}/answers`,
        {
          params: {
            order: 'desc',
            sort: 'votes',
            site: 'stackoverflow',
            filter: 'withbody',
          },
        }
      );

      const answers = answersRes.data.items.map((a) => ({
        body: a.body,
        author: user._id,
      }));

      const newQ = new Question({
  title: q.title,
  body: q.body || 'No body available',
  author: user._id,  // or default user
  tags: q.tags || [],
  answers: answers || [],
  views: q.view_count || 0,
  upvotes: q.score, // allow negative values
});


      await newQ.save();
    }

    console.log('Questions seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
