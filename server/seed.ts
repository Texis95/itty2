import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { InsertUser, InsertPost } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  console.log('Seeding database...');
  
  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await storage.createUser({
    username: "admin",
    password: adminPassword,
    email: "admin@itty.com",
    profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
    bio: "Administrator of Itty"
  });
  
  // Update admin privileges
  await storage.updateUserProfile(admin.id, { isAdmin: true });
  
  // Sample user data
  const users: InsertUser[] = [
    {
      username: "sarah",
      password: await hashPassword("password123"),
      email: "sarah@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/2.jpg",
      bio: "Hiking enthusiast and coffee lover."
    },
    {
      username: "michael",
      password: await hashPassword("password123"),
      email: "michael@example.com",
      profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
      bio: "Tech geek and home office setup specialist."
    },
    {
      username: "jessica",
      password: await hashPassword("password123"),
      email: "jessica@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/4.jpg",
      bio: "Travel blogger and foodie. Always on the lookout for new adventures."
    },
    {
      username: "alex",
      password: await hashPassword("password123"),
      email: "alex@example.com",
      profileImage: "https://randomuser.me/api/portraits/men/5.jpg",
      bio: "Book lover and AI enthusiast."
    },
    {
      username: "rachel",
      password: await hashPassword("password123"),
      email: "rachel@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/6.jpg",
      bio: "Foodie and amateur photographer."
    },
    {
      username: "david",
      password: await hashPassword("password123"),
      email: "david@example.com",
      profileImage: "https://randomuser.me/api/portraits/men/7.jpg",
      bio: "Musician and software developer."
    },
    {
      username: "emily",
      password: await hashPassword("password123"),
      email: "emily@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/8.jpg",
      bio: "Fitness instructor and nutrition expert."
    },
    {
      username: "jason",
      password: await hashPassword("password123"),
      email: "jason@example.com",
      profileImage: "https://randomuser.me/api/portraits/men/9.jpg",
      bio: "Sports fan and barbecue master."
    },
    {
      username: "lisa",
      password: await hashPassword("password123"),
      email: "lisa@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/10.jpg",
      bio: "Artist and designer. Creating beautiful things every day."
    }
  ];
  
  // Create users
  const createdUsers = [];
  for (const userData of users) {
    const user = await storage.createUser(userData);
    createdUsers.push(user);
  }
  
  // Sample post data
  const posts: { userId: number, content: string, images?: string[] }[] = [
    {
      userId: createdUsers[0].id,
      content: "Just finished a great hike today! The views were absolutely breathtaking. Can't wait to go back and explore more of the trails. Nature is truly healing. Who wants to join next time?",
      images: ["https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[1].id,
      content: "Just finished building my new home office setup! What do you think? Any suggestions for improvements?",
      images: ["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[3].id,
      content: "Just finished reading an amazing book on AI ethics. It really made me think about where technology is heading. Does anyone have recommendations for similar books?",
    },
    {
      userId: createdUsers[2].id,
      content: "Exploring the beautiful streets of Paris today. The architecture here is just incredible!",
      images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[4].id,
      content: "Made this delicious pasta dish for dinner tonight. It was absolutely amazing! #foodie #homecooking",
      images: ["https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[5].id,
      content: "Excited to announce I'll be performing live next weekend at the City Park! Hope to see some of you there!",
    },
    {
      userId: createdUsers[6].id,
      content: "New workout routine is kicking my butt, but feeling stronger every day! #fitness #workout",
      images: ["https://images.unsplash.com/photo-1554284126-aa88f22d8b74?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[7].id,
      content: "Game day today! So excited to watch my team play. Who else is watching? #sports",
    },
    {
      userId: createdUsers[8].id,
      content: "Just finished a new painting for my upcoming exhibition. Can't wait to share more of my work!",
      images: ["https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[0].id,
      content: "Beach day with friends! Nothing better than sun, sand, and good company.",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    // Add more posts to reach 30 total
    {
      userId: createdUsers[1].id,
      content: "Productivity hack: I've been using the Pomodoro technique and it's changed my work habits completely.",
    },
    {
      userId: createdUsers[2].id,
      content: "Just tried this amazing coffee shop! The latte art is incredible.",
      images: ["https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[3].id,
      content: "Been learning to code and just finished my first project. It's a simple app but I'm so proud!",
    },
    {
      userId: createdUsers[4].id,
      content: "Farmer's market haul! So many fresh vegetables for the week ahead.",
      images: ["https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[5].id,
      content: "New guitar day! Can't wait to start writing some new songs with this beauty.",
      images: ["https://images.unsplash.com/photo-1525201548942-d8732f6617a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[6].id,
      content: "5K personal best today! All that training is finally paying off. #running",
    },
    {
      userId: createdUsers[7].id,
      content: "Backyard BBQ with the family. Perfect weekend activity!",
      images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[8].id,
      content: "Working on some new designs for my portfolio. Creative process in full swing!",
    },
    {
      userId: createdUsers[0].id,
      content: "Found this amazing waterfall during today's hike. Nature never ceases to amaze me.",
      images: ["https://images.unsplash.com/photo-1494472155656-f34e81b17ddc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[1].id,
      content: "My plant collection is growing! Anyone else become a plant parent during the pandemic?",
      images: ["https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[2].id,
      content: "Nothing better than a good book and a cup of tea on a rainy day.",
    },
    {
      userId: createdUsers[3].id,
      content: "Attended an amazing tech conference today. So many inspiring speakers!",
    },
    {
      userId: createdUsers[4].id,
      content: "Homemade bread success! Took a few tries but I think I've got it now.",
      images: ["https://images.unsplash.com/photo-1568144628871-ccbb00fc297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[5].id,
      content: "Listening to some vinyl records tonight. There's something special about analog sound.",
      images: ["https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[6].id,
      content: "Morning meditation has been a game-changer for my mental health. Highly recommend!",
    },
    {
      userId: createdUsers[7].id,
      content: "Road trip this weekend! Any recommendations for must-see stops?",
    },
    {
      userId: createdUsers[8].id,
      content: "Exhibition opening night was a success! Thank you to everyone who came out to support!",
      images: ["https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[0].id,
      content: "Star gazing tonight. The night sky is absolutely mesmerizing!",
      images: ["https://images.unsplash.com/photo-1465101162946-4377e57745c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    },
    {
      userId: createdUsers[1].id,
      content: "Working from a coffee shop today for a change of scenery. Sometimes you need a new environment to boost creativity!",
    },
    {
      userId: createdUsers[2].id,
      content: "Found this cute little bistro for lunch. The food was incredible!",
      images: ["https://images.unsplash.com/photo-1559304822-9eb2813c9844?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"]
    }
  ];
  
  // Create posts
  const createdPosts = [];
  for (const postData of posts) {
    const post = await storage.createPost(postData as InsertPost);
    createdPosts.push(post);
  }
  
  // Add comments to posts
  const comments = [
    {
      postId: createdPosts[0].id,
      userId: createdUsers[1].id,
      content: "Looks amazing! Which trail is this? I'd love to check it out sometime."
    },
    {
      postId: createdPosts[0].id,
      userId: createdUsers[2].id,
      content: "I'd definitely join you next time! Let me know when you're planning the next trip!"
    },
    {
      postId: createdPosts[1].id,
      userId: createdUsers[3].id,
      content: "That setup looks fantastic! Maybe add some plants for a touch of nature?"
    },
    {
      postId: createdPosts[2].id,
      userId: createdUsers[4].id,
      content: "I just read 'The Alignment Problem' and it was fascinating. Highly recommend!"
    },
    {
      postId: createdPosts[3].id,
      userId: createdUsers[5].id,
      content: "Paris is on my bucket list! The photo is gorgeous."
    },
    {
      postId: createdPosts[4].id,
      userId: createdUsers[6].id,
      content: "That pasta looks delicious! Would you mind sharing the recipe?"
    },
    {
      postId: createdPosts[5].id,
      userId: createdUsers[7].id,
      content: "I'll definitely be there! Looking forward to it."
    },
    {
      postId: createdPosts[6].id,
      userId: createdUsers[8].id,
      content: "Keep it up! What's your favorite exercise in the routine?"
    },
    {
      postId: createdPosts[7].id,
      userId: createdUsers[0].id,
      content: "Watching the game too! It's so exciting!"
    },
    {
      postId: createdPosts[8].id,
      userId: createdUsers[1].id,
      content: "That's beautiful! You're so talented."
    }
  ];
  
  // Create comments
  for (const commentData of comments) {
    await storage.createComment(commentData);
  }
  
  // Add likes to posts
  const likes = [
    { postId: createdPosts[0].id, userId: createdUsers[1].id },
    { postId: createdPosts[0].id, userId: createdUsers[2].id },
    { postId: createdPosts[0].id, userId: createdUsers[3].id },
    { postId: createdPosts[1].id, userId: createdUsers[0].id },
    { postId: createdPosts[1].id, userId: createdUsers[2].id },
    { postId: createdPosts[2].id, userId: createdUsers[4].id },
    { postId: createdPosts[2].id, userId: createdUsers[5].id },
    { postId: createdPosts[3].id, userId: createdUsers[0].id },
    { postId: createdPosts[3].id, userId: createdUsers[5].id },
    { postId: createdPosts[4].id, userId: createdUsers[6].id },
    { postId: createdPosts[5].id, userId: createdUsers[7].id },
    { postId: createdPosts[6].id, userId: createdUsers[8].id },
    { postId: createdPosts[7].id, userId: createdUsers[0].id },
    { postId: createdPosts[8].id, userId: createdUsers[1].id },
    { postId: createdPosts[9].id, userId: createdUsers[2].id }
  ];
  
  // Create likes
  for (const likeData of likes) {
    await storage.createLike(likeData);
  }
  
  // Add some shares
  const shares = [
    { postId: createdPosts[0].id, userId: createdUsers[3].id },
    { postId: createdPosts[1].id, userId: createdUsers[4].id },
    { postId: createdPosts[3].id, userId: createdUsers[6].id }
  ];
  
  // Create shares
  for (const shareData of shares) {
    await storage.createShare(shareData);
  }
  
  // Add some messages between users
  const messages = [
    { senderId: createdUsers[0].id, receiverId: createdUsers[1].id, content: "Hey, how are you doing?" },
    { senderId: createdUsers[1].id, receiverId: createdUsers[0].id, content: "I'm good, thanks! How about you?" },
    { senderId: createdUsers[0].id, receiverId: createdUsers[1].id, content: "Doing well, just planning my next hike." },
    { senderId: createdUsers[2].id, receiverId: createdUsers[0].id, content: "That hiking spot you posted looks amazing!" },
    { senderId: createdUsers[0].id, receiverId: createdUsers[2].id, content: "It was incredible! We should go together sometime." },
    { senderId: createdUsers[1].id, receiverId: createdUsers[2].id, content: "Did you see that new tech gadget that just came out?" },
    { senderId: createdUsers[2].id, receiverId: createdUsers[1].id, content: "Yes! It looks so cool! Are you going to get it?" }
  ];
  
  // Create messages
  for (const messageData of messages) {
    await storage.createMessage(messageData);
  }
  
  // Add some notifications
  const notifications = [
    { userId: createdUsers[0].id, actorId: createdUsers[1].id, type: 'like', entityId: createdPosts[0].id },
    { userId: createdUsers[0].id, actorId: createdUsers[2].id, type: 'comment', entityId: createdPosts[0].id },
    { userId: createdUsers[1].id, actorId: createdUsers[0].id, type: 'like', entityId: createdPosts[1].id },
    { userId: createdUsers[3].id, actorId: createdUsers[0].id, type: 'share', entityId: createdPosts[3].id }
  ];
  
  // Create notifications
  for (const notificationData of notifications) {
    await storage.createNotification(notificationData);
  }
  
  console.log('Database seeded successfully!');
  console.log('Created 10 users, 30 posts, and various interactions');
  console.log('Admin user: username=admin, password=admin123');
  console.log('Regular users: username=[name], password=password123');
}
