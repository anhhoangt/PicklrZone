import { initializeApp, cert, ServiceAccount, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

if (getApps().length === 0) {
  const serviceAccount = require(
    path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json")
  ) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function clearCollection(name: string) {
  const snapshot = await db.collection(name).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`   🗑️  Cleared ${snapshot.size} docs from ${name}`);
}

async function seed() {
  console.log("🏓 Re-seeding PicklrZone with real video URLs...\n");

  console.log("🧹 Clearing old data...");
  await clearCollection("courses");
  await clearCollection("reviews");
  await clearCollection("submissions");
  await clearCollection("bookings");
  console.log("");

  // Keep existing user profiles — only re-seed courses + reviews

  const now = new Date().toISOString();
  const coursesData = [
    {
      title: "Mastering the Third Shot Drop",
      shortDescription: "The most important shot in pickleball. Learn to control the kitchen line.",
      description: `The third shot drop is arguably the most critical shot in pickleball. It's the shot that transitions your team from defense to offense.

In this comprehensive course, I break down every aspect of the third shot drop:
- Proper grip and paddle angle
- Weight transfer and follow-through
- Reading your opponent's position
- When to drop vs drive
- Drills you can practice alone or with a partner

By the end of this course, you'll have a reliable third shot drop that keeps your opponents guessing.`,
      price: 49.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg",
      category: "Third Shot Drop",
      level: "intermediate",
      vendorId: "vendor-ben-johns",
      vendorName: "Ben Johns",
      vendorLocation: "Austin, TX",
      averageRating: 4.8,
      totalReviews: 3,
      totalStudents: 142,
      lessons: [
        { title: "Why the Third Shot Drop Matters", description: "Understanding the strategic importance of the third shot", videoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg", duration: 12, order: 1 },
        { title: "Grip and Paddle Position", description: "Setting up the continental grip for the perfect drop", videoUrl: "https://www.youtube.com/watch?v=q_5zPCZ2MSY", duration: 15, order: 2 },
        { title: "The Drop Motion", description: "Step-by-step breakdown of the swing path", videoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo", duration: 20, order: 3 },
        { title: "Reading the Court", description: "When to drop vs. when to drive", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 18, order: 4 },
        { title: "Practice Drills", description: "Solo and partner drills to master your drop", videoUrl: "https://www.youtube.com/watch?v=wm7VjIMbJoM", duration: 25, order: 5 },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Pickleball Fundamentals: Zero to Hero",
      shortDescription: "Complete beginner course. Learn rules, grips, serves, and basic strategy.",
      description: `Never picked up a paddle before? This is the course for you!

I'll take you from absolute zero to confidently playing recreational games. We cover:
- Rules and scoring
- Choosing your paddle
- The continental grip
- Serving basics
- Returning serves
- Dinking fundamentals
- Basic doubles positioning

No prior experience needed. Just bring your enthusiasm!`,
      price: 29.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo",
      category: "Fundamentals",
      level: "beginner",
      vendorId: "vendor-anna-leigh",
      vendorName: "Anna Leigh Waters",
      vendorLocation: "Orlando, FL",
      averageRating: 4.9,
      totalReviews: 2,
      totalStudents: 318,
      lessons: [
        { title: "Welcome to Pickleball!", description: "History and why it's the fastest growing sport", videoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo", duration: 8, order: 1 },
        { title: "Rules & Scoring", description: "Everything you need to know about pickleball rules", videoUrl: "https://www.youtube.com/watch?v=wm7VjIMbJoM", duration: 15, order: 2 },
        { title: "Choosing Your Paddle", description: "What to look for in your first paddle", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 10, order: 3 },
        { title: "The Continental Grip", description: "The foundation grip for every shot", videoUrl: "https://www.youtube.com/watch?v=eNg-KX7VBbM", duration: 12, order: 4 },
        { title: "Serving 101", description: "Legal serves and smart placement", videoUrl: "https://www.youtube.com/watch?v=Kq5_E0FntzM", duration: 18, order: 5 },
        { title: "The Return of Serve", description: "Getting into the right position", videoUrl: "https://www.youtube.com/watch?v=q_5zPCZ2MSY", duration: 14, order: 6 },
        { title: "Dinking Basics", description: "Introduction to the soft game", videoUrl: "https://www.youtube.com/watch?v=xNHSFjjkfHo", duration: 20, order: 7 },
        { title: "Doubles Positioning", description: "Where to stand and why", videoUrl: "https://www.youtube.com/watch?v=oyB5Hih3_8o", duration: 16, order: 8 },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Killer Serve Masterclass",
      shortDescription: "Develop 5 different serves that keep opponents off balance every game.",
      description: `Your serve is the one shot where you have 100% control. Make it count!

In this masterclass, you'll learn 5 serve variations:
1. The Deep Power Serve
2. The Lob Serve
3. The Spin Serve (topspin & sidespin)
4. The Body Serve
5. The Short Angle Serve

For each serve, you'll learn the exact mechanics, when to use it, and how to practice it.`,
      price: 39.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=eNg-KX7VBbM",
      category: "Serving",
      level: "intermediate",
      vendorId: "vendor-tyson-mcguffin",
      vendorName: "Tyson McGuffin",
      vendorLocation: "Seattle, WA",
      averageRating: 4.6,
      totalReviews: 2,
      totalStudents: 89,
      lessons: [
        { title: "Serve Fundamentals Review", description: "Perfect your base serve first", videoUrl: "https://www.youtube.com/watch?v=eNg-KX7VBbM", duration: 14, order: 1 },
        { title: "The Deep Power Serve", description: "Push opponents behind the baseline", videoUrl: "https://www.youtube.com/watch?v=Kq5_E0FntzM", duration: 18, order: 2 },
        { title: "The Lob Serve", description: "High arc, deep placement strategy", videoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo", duration: 15, order: 3 },
        { title: "Spin Serves", description: "Topspin and sidespin variations", videoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg", duration: 22, order: 4 },
        { title: "The Body Serve & Short Angle", description: "Target the opponent directly", videoUrl: "https://www.youtube.com/watch?v=q_5zPCZ2MSY", duration: 16, order: 5 },
        { title: "Serve Sequencing Strategy", description: "Game-planning your serves for maximum effect", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 20, order: 6 },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "The Art of Dinking",
      shortDescription: "Master the soft game. Win points with patience, touch, and placement.",
      description: `Pickleball is a game of patience, and nowhere is that more true than at the kitchen line.

This course will transform your dinking game:
- Cross-court dinks with perfect placement
- Inside-out dinks to move opponents
- Reset dinks when you're in trouble
- Speed-up attacks from the dink
- Reading your opponent's body language

The soft game separates 3.5 players from 4.5+ players.`,
      price: 44.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1560012057-4372e14c5085?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=xNHSFjjkfHo",
      category: "Dinking",
      level: "advanced",
      vendorId: "vendor-simone-jardim",
      vendorName: "Simone Jardim",
      vendorLocation: "Naples, FL",
      averageRating: 4.7,
      totalReviews: 2,
      totalStudents: 67,
      lessons: [
        { title: "The Dinking Mindset", description: "Patience wins points at the kitchen", videoUrl: "https://www.youtube.com/watch?v=xNHSFjjkfHo", duration: 10, order: 1 },
        { title: "Cross-Court Dinks", description: "The bread and butter of soft play", videoUrl: "https://www.youtube.com/watch?v=PfMm45VdUgo", duration: 18, order: 2 },
        { title: "Inside-Out Dinks", description: "Move your opponent around the court", videoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo", duration: 16, order: 3 },
        { title: "Reset Dinks", description: "Surviving the firefight and regaining control", videoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg", duration: 20, order: 4 },
        { title: "Speed-Up Attacks", description: "When to pull the trigger from the dink", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 22, order: 5 },
        { title: "Reading Opponents", description: "Body language tells all at the kitchen line", videoUrl: "https://www.youtube.com/watch?v=oyB5Hih3_8o", duration: 15, order: 6 },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Doubles Strategy Blueprint",
      shortDescription: "Dominate doubles with pro-level positioning, stacking, and communication.",
      description: `Doubles is where pickleball really shines, and strategy is everything.

This blueprint covers:
- Ideal court positioning
- Stacking: when and how to use it
- Poaching and fake poaching
- Communication systems with your partner
- How to handle lobbers

Whether you're playing rec or tournaments, these strategies give you a massive edge.`,
      price: 54.99,
      thumbnailUrl: "https://images.unsplash.com/photo-1544298621-a23b9e325012?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=oyB5Hih3_8o",
      category: "Doubles",
      level: "all-levels",
      vendorId: "vendor-ben-johns",
      vendorName: "Ben Johns",
      vendorLocation: "Austin, TX",
      averageRating: 4.5,
      totalReviews: 2,
      totalStudents: 203,
      lessons: [
        { title: "Doubles Fundamentals", description: "Court positioning basics", videoUrl: "https://www.youtube.com/watch?v=oyB5Hih3_8o", duration: 14, order: 1 },
        { title: "The Serve & Return Phase", description: "Setting up the point correctly", videoUrl: "https://www.youtube.com/watch?v=eNg-KX7VBbM", duration: 18, order: 2 },
        { title: "Transitioning to the Net", description: "Moving up together as a team", videoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg", duration: 16, order: 3 },
        { title: "Stacking Explained", description: "Optimize your team's strengths", videoUrl: "https://www.youtube.com/watch?v=MjX5RO85JOg", duration: 22, order: 4 },
        { title: "Poaching & Faking", description: "Aggressive net play tactics", videoUrl: "https://www.youtube.com/watch?v=q_5zPCZ2MSY", duration: 18, order: 5 },
        { title: "Communication Systems", description: "Talk your way to wins", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 12, order: 6 },
        { title: "Advanced Situational Play", description: "Handling lobs, drives, and resets", videoUrl: "https://www.youtube.com/watch?v=xNHSFjjkfHo", duration: 20, order: 7 },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Pickleball Fitness & Injury Prevention",
      shortDescription: "Stay on the court longer. Workouts, stretches, and recovery for players.",
      description: `The best ability is availability. This course keeps you healthy and performing at your peak.

Designed specifically for pickleball players, covering:
- Dynamic warm-up routines
- Lateral agility drills
- Core strength for stability
- Shoulder and elbow injury prevention
- Recovery stretches and foam rolling

Every exercise is demonstrated with modifications. No gym required.`,
      price: 0,
      thumbnailUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=225&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=wm7VjIMbJoM",
      category: "Fitness & Conditioning",
      level: "all-levels",
      vendorId: "vendor-anna-leigh",
      vendorName: "Anna Leigh Waters",
      vendorLocation: "Orlando, FL",
      averageRating: 4.4,
      totalReviews: 1,
      totalStudents: 455,
      lessons: [
        { title: "Dynamic Warm-Up Routine", description: "10 minutes before every game", videoUrl: "https://www.youtube.com/watch?v=wm7VjIMbJoM", duration: 12, order: 1 },
        { title: "Lateral Agility Drills", description: "Quick feet win rallies", videoUrl: "https://www.youtube.com/watch?v=fTODGsLGZEo", duration: 18, order: 2 },
        { title: "Core Strength Program", description: "Stability and power for every shot", videoUrl: "https://www.youtube.com/watch?v=CZwpaFT5UEg", duration: 22, order: 3 },
        { title: "Injury Prevention", description: "Protecting shoulders, elbows, and knees", videoUrl: "https://www.youtube.com/watch?v=eNg-KX7VBbM", duration: 16, order: 4 },
        { title: "Post-Game Recovery", description: "Stretches and foam rolling routines", videoUrl: "https://www.youtube.com/watch?v=GM_Gx_iUbMg", duration: 14, order: 5 },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  console.log("📚 Creating courses with video lessons...");
  const courseIds: string[] = [];
  for (const course of coursesData) {
    const docRef = await db.collection("courses").add(course);
    courseIds.push(docRef.id);
    const videoCount = course.lessons.filter(l => l.videoUrl).length;
    console.log(`   ✅ "${course.title}" — ${course.lessons.length} lessons, ${videoCount} videos`);
  }
  console.log("");

  // Re-create reviews linked to new course IDs
  const reviewsData = [
    { courseIdx: 0, userId: "student-mike", userName: "Mike Chen", rating: 5, text: "Game changer! My third shot drop went from 20% consistency to over 70% in just two weeks." },
    { courseIdx: 0, userId: "student-sarah", userName: "Sarah Kim", rating: 5, text: "Even as a newer player, I could follow along. The drills section alone is worth the price." },
    { courseIdx: 0, userId: "student-james", userName: "James Rodriguez", rating: 4, text: "Great content overall. Coming from tennis, this course helped me unlearn some habits." },
    { courseIdx: 1, userId: "student-sarah", userName: "Sarah Kim", rating: 5, text: "PERFECT for beginners! I went from never holding a paddle to playing full games in a week." },
    { courseIdx: 1, userId: "student-mike", userName: "Mike Chen", rating: 5, text: "Bought this for my wife who just started. She loved it and now we play doubles every weekend!" },
    { courseIdx: 2, userId: "student-james", userName: "James Rodriguez", rating: 5, text: "The spin serve section is incredible. My opponents have no idea what's coming anymore." },
    { courseIdx: 2, userId: "student-mike", userName: "Mike Chen", rating: 4, text: "Solid course. The serve sequencing strategy was eye-opening." },
    { courseIdx: 3, userId: "student-mike", userName: "Mike Chen", rating: 5, text: "Simone is the queen of the soft game and it shows. My dinking has improved dramatically." },
    { courseIdx: 3, userId: "student-james", userName: "James Rodriguez", rating: 4, text: "Really helped me slow down my game. Dinking wins at higher levels." },
    { courseIdx: 4, userId: "student-sarah", userName: "Sarah Kim", rating: 5, text: "The stacking explanation finally clicked! We won our local tournament after this." },
    { courseIdx: 4, userId: "student-james", userName: "James Rodriguez", rating: 4, text: "Good strategic content. The communication systems section was very helpful." },
    { courseIdx: 5, userId: "student-mike", userName: "Mike Chen", rating: 4, text: "The warm-up routine alone has helped my knees feel better. Great free resource!" },
  ];

  console.log("⭐ Creating reviews...");
  for (const review of reviewsData) {
    await db.collection("reviews").add({
      courseId: courseIds[review.courseIdx],
      userId: review.userId,
      userName: review.userName,
      userPhotoURL: "",
      rating: review.rating,
      text: review.text,
      createdAt: new Date().toISOString(),
    });
  }
  console.log(`   ✅ ${reviewsData.length} reviews created\n`);

  const totalVideos = coursesData.reduce((s, c) => s + c.lessons.filter(l => l.videoUrl).length, 0);
  console.log("🎉 Seed complete!");
  console.log(`   ${coursesData.length} courses`);
  console.log(`   ${coursesData.reduce((s, c) => s + c.lessons.length, 0)} total lessons`);
  console.log(`   ${totalVideos} video lessons (all with real YouTube URLs)`);
  console.log(`   ${reviewsData.length} reviews`);
  console.log("\n🏓 Restart the backend and test video playback!");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
