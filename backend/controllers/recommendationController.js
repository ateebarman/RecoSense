const fs = require("fs");
const path = require("path");

// Random demo user pool (replace or extend as needed)
const DEMO_USER_IDS = [
  "AGP7EEKKJLA6CWVVGFW35VOUJDCA",
  "AGK75AOJP6GW6GYYDMMIKLWBIMMA",
  "AGH4VWMDVSXIEJVCNFZ3PMVUNM7Q",
  "AGYIN4WCKIPEJFB3EHDKBBZ53Z3Q",
  "AHTDWJH73LM6QYUN2LARA3SNAFRA",
  "AG3M7LZBCFPKYTG6GQAGZQD2QAHQ",
  "AG7QVV3NBCA3FB35XOIGKFMH4RLQ",
];

function safeJSONParse(line) {
  try {
    return JSON.parse(line);
  } catch (e) {
    return null;
  }
}

function loadJsonLines(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) return [];
  const raw = fs.readFileSync(abs, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const items = [];
  for (const line of lines) {
    let obj = safeJSONParse(line.trim());
    if (!obj) {
      const match = line.match(/(\{[\s\S]*\})/);
      if (match) obj = safeJSONParse(match[1]);
    }
    if (obj) items.push(obj);
  }
  return items;
}

function getAspectColumnsFromData(reviewsData) {
  const aspectColumns = new Set();
  for (const r of reviewsData) {
    for (const k of Object.keys(r)) {
      if (k.endsWith("_score")) aspectColumns.add(k);
    }
  }
  return Array.from(aspectColumns);
}

function averageVector(vectors) {
  if (vectors.length === 0) return {};
  const sums = {};
  for (const vec of vectors) {
    for (const [k, v] of Object.entries(vec)) {
      const val = typeof v === "number" && isFinite(v) ? v : 0;
      sums[k] = (sums[k] || 0) + val;
    }
  }
  const result = {};
  const count = vectors.length;
  for (const [k, v] of Object.entries(sums)) result[k] = v / count;
  return result;
}

function cosineSimilarity(a, b, keys) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const av = typeof a[k] === "number" ? a[k] : 0;
    const bv = typeof b[k] === "number" ? b[k] : 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function topNKeys(obj, n) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function recommendProductsJS({ userId, reviewsFile, metadataFile, topN = 30, reviewsData = null, metadataData = null }) {
  // allow passing preloaded arrays (e.g., to include DB reviews) or fallback to file loading
  if (!reviewsData) reviewsData = loadJsonLines(reviewsFile);
  if (!metadataData) metadataData = loadJsonLines(metadataFile);

  if (reviewsData.length === 0) {
    return { userId, recommendations: [], message: "No reviews data found" };
  }

  const aspectCols = getAspectColumnsFromData(reviewsData);
  if (aspectCols.length === 0) {
    return {
      userId,
      recommendations: [],
      message: "No aspect score columns found",
    };
  }

  const userReviews = reviewsData.filter((r) => r.user_id === userId);
  if (userReviews.length === 0) {
    return {
      userId,
      recommendations: [],
      message: `User ${userId} not found in dataset`,
    };
  }

  const userVectors = userReviews.map((r) => {
    const vec = {};
    for (const k of aspectCols) vec[k] = Number(r[k]) || 0;
    return vec;
  });
  const userAspectProfile = averageVector(userVectors);

  const userItems = new Set(userReviews.map((r) => r.asin));
  const allAsins = Array.from(new Set(reviewsData.map((r) => r.asin)));
  const candidateAsins = allAsins.filter((a) => !userItems.has(a));

  const metaByAsin = new Map();
  for (const m of metadataData) {
    if (m.parent_asin) metaByAsin.set(m.parent_asin, m);
    if (m.asin && !metaByAsin.has(m.asin)) metaByAsin.set(m.asin, m);
  }

  const itemScores = [];
  for (const asin of candidateAsins) {
    const itemReviews = reviewsData.filter((r) => r.asin === asin);
    if (itemReviews.length === 0) continue;

    const itemVectors = itemReviews.map((r) => {
      const vec = {};
      for (const k of aspectCols) vec[k] = Number(r[k]) || 0;
      return vec;
    });
    const itemAspectProfile = averageVector(itemVectors);
    const similarity = cosineSimilarity(
      userAspectProfile,
      itemAspectProfile,
      aspectCols
    );

    const ratings = itemReviews
      .map((r) => Number(r.rating))
      .filter((v) => isFinite(v));
    const avgRating = ratings.length
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;
    const popFactor = Math.log(1 + itemReviews.length) / 10;
    const combinedScore =
      0.7 * similarity + 0.2 * (avgRating / 5.0) + 0.1 * popFactor;

    const topAspects = topNKeys(itemAspectProfile, 3).map((a) =>
      a.replace("_score", "")
    );
    itemScores.push({
      asin,
      score: combinedScore,
      similarity,
      top_aspects: topAspects,
    });
  }

  itemScores.sort((a, b) => b.score - a.score);

  const recommendations = itemScores.slice(0, topN).map((it, idx) => {
    let meta = metaByAsin.get(it.asin);
    const rec = {
      rank: idx + 1,
      asin: it.asin,
      score: Number(it.score.toFixed(6)),
      similarity: Number(it.similarity.toFixed(6)),
      top_aspects: it.top_aspects,
    };
    if (meta) {
      rec.title = meta.title || `Product ${it.asin}`;
      rec.price = meta.price ?? null;
      rec.category = meta.main_category || "";
      rec.avg_rating = meta.average_rating || 0;
      rec.images = meta.images || [];
    }
    return rec;
  });

  return { userId, recommendations };
}

// GET /api/recommendations
async function getRecommendations(req, res) {
  try {
    const topN = Number(req.query.top_n) || 30;
    const requestedUserId = req.query.user_id;
    const reviewsFile = path.join(__dirname, "..", "data", "absa_reviews.json");
    const metadataFile = path.join(__dirname, "..", "data", "metadata.jsonl");

    // If user_id provided, use it; otherwise use a demo user id
    let userId = requestedUserId || DEMO_USER_IDS[Math.floor(Math.random() * DEMO_USER_IDS.length)];

    // Attempt to load user demographics from DB to handle cold-start
    const User = require('../models/userModel');
    const Review = require('../models/reviewModel');

    // Load file-based reviews and metadata
    const reviewsData = loadJsonLines(reviewsFile);
    const metadataData = loadJsonLines(metadataFile);

    // Merge any DB reviews for this user into userReviews
    const dbReviews = await Review.find({ user_id: userId }).lean().exec().catch(() => []);
    const fileUserReviews = reviewsData.filter((r) => r.user_id === userId);
    const userReviews = fileUserReviews.concat(dbReviews);

    // Check if user has enough interactions (reviews + likes) to use LightFM
    const UserModel = require('../models/userModel');
    const dbUser = await UserModel.findOne({ user_id: userId }).lean().exec().catch(() => null);
    const likesCount = dbUser && Array.isArray(dbUser.likedProducts) ? dbUser.likedProducts.length : 0;
    const interactionsCount = userReviews.length + likesCount;
    const LIGHTFM_THRESHOLD = Number(process.env.LIGHTFM_THRESHOLD || 5); // tune via env

    if (interactionsCount >= LIGHTFM_THRESHOLD) {
      // Try to load precomputed LightFM recommendations from disk
      try {
        const lmPath = path.join(__dirname, '..', 'data', 'lightfm_recs.json');
        if (fs.existsSync(lmPath)) {
          const raw = fs.readFileSync(lmPath, 'utf-8');
          const lm = JSON.parse(raw);
          if (lm[userId] && lm[userId].length > 0) {
            return res.json({ userId, recommendations: lm[userId], model_used: 'lightfm' });
          }
        }
      } catch (e) {
        console.error('Error loading lightfm recs:', e);
      }
      // fallback to aspect-based if LightFM not available for this user
      const mergedReviews = reviewsData.concat(dbReviews);
      const rec = recommendProductsJS({ userId, topN, reviewsData: mergedReviews, metadataData });
      return res.json({ ...rec, model_used: 'aspect_based (fallback)' });
    }

    // If there are user reviews (from file or DB), run normal aspect-based recommendation
    if (userReviews.length > 0) {
      const mergedReviews = reviewsData.concat(dbReviews);
      const localRecommend = recommendProductsJS({ userId, topN, reviewsData: mergedReviews, metadataData });
      return res.json({ ...localRecommend, model_used: 'aspect_based' });
    }

    // Cold-start: no reviews for this user; try demographic/location based popularity
    const user = await User.findOne({ user_id: userId }).lean().exec();
    let candidates = [];
    if (user && (user.age_group || user.gender || user.location)) {
      // Find similar users by exact matching demographic triplet
      const query = { age_group: user.age_group, gender: user.gender, location: user.location };
      // fallback to partial matches if exact match not found
      let similarUsers = await User.find(query).lean().exec();
      if (!similarUsers || similarUsers.length === 0) {
        const orQueries = [];
        if (user.age_group) orQueries.push({ age_group: user.age_group });
        if (user.gender) orQueries.push({ gender: user.gender });
        if (user.location) orQueries.push({ location: user.location });
        if (orQueries.length) similarUsers = await User.find({ $or: orQueries }).lean().exec();
      }

      // Aggregate popularity from likedProducts and historical file reviews by these users
      const LIKED_WEIGHT = Number(process.env.DEMO_LIKED_WEIGHT || 3);
      const REVIEW_WEIGHT = Number(process.env.DEMO_REVIEW_WEIGHT || 1);
      const popularity = new Map();
      for (const su of similarUsers) {
        if (Array.isArray(su.likedProducts)) {
          for (const asin of su.likedProducts) popularity.set(asin, (popularity.get(asin) || 0) + LIKED_WEIGHT);
        }
      }
      // from file reviews of similar users
      const similarUserIds = new Set(similarUsers.map((s) => s.user_id));
      for (const r of reviewsData) {
        if (similarUserIds.has(r.user_id)) {
          popularity.set(r.asin, (popularity.get(r.asin) || 0) + REVIEW_WEIGHT);
        }
      }

      // if we have popularity candidates
      if (popularity.size > 0) {
        const items = Array.from(popularity.entries()).map(([asin, score]) => ({ asin, score }));
        items.sort((a, b) => b.score - a.score);

        // Prefer items with metadata and images first
        const withImages = items.filter((it) => {
          const meta = metadataData.find((m) => (m.parent_asin === it.asin || m.asin === it.asin));
          return meta && Array.isArray(meta.images) && meta.images.length > 0 && meta.title;
        });

        // Then items that at least have a title
        const withTitle = items.filter((it) => {
          const meta = metadataData.find((m) => (m.parent_asin === it.asin || m.asin === it.asin));
          return meta && meta.title && !(Array.isArray(meta.images) && meta.images.length > 0);
        });

        const prioritized = [...withImages, ...withTitle];

        candidates = [];
        for (const it of prioritized) {
          if (candidates.length >= topN) break;
          const meta = metadataData.find((m) => (m.parent_asin === it.asin || m.asin === it.asin));
          if (!meta || !meta.title) continue; // skip entries without useful metadata
          candidates.push({
            rank: candidates.length + 1,
            asin: it.asin,
            score: it.score,
            title: meta.title,
            images: meta.images || [],
            price: meta.price ?? null,
            avg_rating: meta.average_rating || 0,
            category: meta.main_category || ''
          });
        }

        // If still short, fill with globally popular items that have images
        if (candidates.length < topN) {
          const existingAsins = new Set(candidates.map((c) => c.asin));
          const countByAsin = {};
          for (const r of reviewsData) countByAsin[r.asin] = (countByAsin[r.asin] || 0) + 1;
          const globalItems = Object.entries(countByAsin)
            .map(([asin, cnt]) => ({ asin, cnt, meta: metadataData.find((m) => (m.parent_asin === asin || m.asin === asin)) }))
            .filter((it) => !existingAsins.has(it.asin) && it.meta && Array.isArray(it.meta.images) && it.meta.images.length > 0)
            .sort((a, b) => b.cnt - a.cnt);

          for (const it of globalItems) {
            if (candidates.length >= topN) break;
            candidates.push({
              rank: candidates.length + 1,
              asin: it.asin,
              score: it.cnt,
              title: it.meta.title,
              images: it.meta.images || [],
              price: it.meta.price ?? null,
              avg_rating: it.meta.average_rating || 0,
              category: it.meta.main_category || ''
            });
          }
        }

        // Return only items with metadata/title (avoid ASIN-only blanks)
        return res.json({ userId, recommendations: candidates, message: 'Cold-start: demographic popularity' });
      }
    }

    // If user exists but has no demographics, fall back to using a demo user model
    if (user && !(user.age_group || user.gender || user.location)) {
      const demoUser = DEMO_USER_IDS[Math.floor(Math.random() * DEMO_USER_IDS.length)];
      const demoRecommend = recommendProductsJS({ userId: demoUser, reviewsFile, metadataFile, topN });
      return res.json({ userId, recommendations: demoRecommend.recommendations, message: 'Fallback: demo user model' });
    }

    // Fallback: global popularity computed from file reviews (only include items with metadata and images)
    const countByAsin = {};
    for (const r of reviewsData) countByAsin[r.asin] = (countByAsin[r.asin] || 0) + 1;
    const globalItems = Object.entries(countByAsin)
      .map(([asin, cnt]) => ({ asin, cnt, meta: metadataData.find((m) => (m.parent_asin === asin || m.asin === asin)) }))
      .filter((it) => it.meta && Array.isArray(it.meta.images) && it.meta.images.length > 0 && it.meta.title)
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, topN);

    const globalCandidates = globalItems.map((it, idx) => ({
      rank: idx + 1,
      asin: it.asin,
      score: it.cnt,
      title: it.meta.title,
      images: it.meta.images || [],
      price: it.meta.price ?? null,
      avg_rating: it.meta.average_rating || 0,
      category: it.meta.main_category || ''
    }));
    return res.json({ userId, recommendations: globalCandidates, message: 'Cold-start: global popularity' });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
}

module.exports = { getRecommendations };
