const process = require('process');
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
// Assuming these are correctly imported based on your context
const connectDB = require('./config/db'); 
const Question = require('./models/Questions');
const User = require('./models/User');

// --- CONFIGURATION ---
// List of tags to cycle through to ensure diversity
const TAGS_TO_FETCH = [
    'javascript',
    'python',
    'java',
    'c#',
    'typescript',
    'node.js',
    'angular',
    'reactjs',
    'mongodb',
    'algorithm',
    'machine-learning'
];

// Number of pages to fetch FOR EACH TAG (100 questions per page)
const PAGES_PER_TAG = 3; // Total questions = 11 tags * 3 pages * 100 questions = 3300 questions (Be mindful of API limits!)
const STACK_EXCHANGE_API_URL = 'https://api.stackexchange.com/2.3';
// ---------------------

// Helper function to pause execution to respect API rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seed() {
    try {
        await connectDB();
        console.log('Database connection established.');

        // 1. Find or create a default user for authors
        let user = await User.findOne({ email: 'admin@example.com' });
        if (!user) {
            user = new User({
                name: 'Admin',
                email: 'admin@example.com',
                password: 'hashedpassword', 
            });
            await user.save();
            console.log('Created default Admin user.');
        } else {
            console.log('Using existing Admin user.');
        }

        const authorId = user._id;
        let totalQuestionsFetched = 0;

        for (const tag of TAGS_TO_FETCH) {
            console.log(`\n=================================================`);
            console.log(`|| STARTING TAG: ${tag.toUpperCase()} ||`);
            console.log(`=================================================`);

            for (let page = 1; page <= PAGES_PER_TAG; page++) {
                console.log(`--- Fetching Page ${page}/${PAGES_PER_TAG} for tag: ${tag}`);

                // Fetch QUESTIONS (100 per page) - FILTERED BY TAG
                const questionsRes = await axios.get(
                    `${STACK_EXCHANGE_API_URL}/questions`,
                    {
                        params: {
                            page: page,
                            pagesize: 100,
                            order: 'desc',
                            sort: 'activity',
                            site: 'stackoverflow',
                            filter: 'withbody',
                            tagged: tag, // KEY CHANGE: Filter by current tag
                        },
                    }
                );

                if (questionsRes.data.items.length === 0) {
                    console.log(`No more questions found for tag ${tag} after page ${page - 1}. Stopping iteration for this tag.`);
                    break;
                }

                for (const q of questionsRes.data.items) {
                    // Fetch ANSWERS for the current question
                    const answersRes = await axios.get(
                        `${STACK_EXCHANGE_API_URL}/questions/${q.question_id}/answers`,
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
                        author: authorId,
                        votes: a.score || 0,
                    }));

                    const newQ = new Question({
                        title: q.title,
                        body: q.body || 'No body available',
                        author: authorId,
                        tags: q.tags || [],
                        answers: answers,
                        views: q.view_count || 0,
                        upvotes: q.score || 0,
                        createdAt: new Date(q.creation_date * 1000),
                    });

                    await newQ.save();
                    totalQuestionsFetched++;
                }
                
                console.log(`Finished processing Page ${page}. Total fetched so far: ${totalQuestionsFetched}`);
                
                // Wait to respect API limits
                console.log("Pausing for 1 second to respect API limits...");
                await sleep(1000); 
            }
        } // End of TAG loop

        console.log(`\n--- Seeding Complete! Successfully added ${totalQuestionsFetched} total questions to the database.`);
        process.exit();
    } catch (err) {
        console.error("CRITICAL ERROR during seeding:", err);
        process.exit(1);
    }
}

seed();
