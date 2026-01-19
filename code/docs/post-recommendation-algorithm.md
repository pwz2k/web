# Post Recommendation Algorithm Documentation

## Overview

The post recommendation algorithm powers the main feed of the social media platform, delivering personalized content to users through the `/` endpoint. It combines sophisticated filtering, scoring, and diversity mechanisms to create an engaging, varied, and personalized feed experience while preventing content repetition.

## Core Objectives

1. **Content Freshness**: Prioritize newer content while still surfacing high-quality older posts
2. **Engagement Quality**: Promote posts with high-quality engagement using the platform's voting system
3. **Personalization**: Consider user preferences and viewing history
4. **Creator Diversity**: Prevent feed domination by a single creator
5. **Repetition Avoidance**: Reduce showing posts users have already seen or interacted with
6. **Randomization**: Include controlled randomness to discover diverse content
7. **Fallback Mechanisms**: Provide quality content even when personalization data is limited

## Data Collection

### User Context
- Authentication status (logged in vs. anonymous)
- Gender preferences (optional filter)
- Previously voted posts
- Recently viewed posts (tracked for 30 days)
- View timestamps (for recency calculations)

### Content Filters
- Approval status (only approved posts)
- Creator diversity (limits on post frequency from the same creator)
- Exclusion filters (previously seen/voted content)

## Algorithm Components

### 1. Initial Query Construction

The algorithm begins by building query filters based on:
```typescript
// Base filter applied to all users
const baseFilter = {
  approvalStatus: 'APPROVED',
};

// Optional preference filter
if (preference) {
  baseFilter.creator = { gender: preference };
}

// Build personalized filter with exclusions
const authFilter = {
  ...baseFilter,
  ...(excludePostIds.length > 0 && { id: { notIn: excludePostIds } }),
  ...(user && { creatorId: { not: user.id } }),
};
```

### 2. Content Selection Process

The system follows a multi-step content selection process:
1. **Primary Selection**: Fetch posts user hasn't seen or voted on
2. **Randomized Fallback**: If no unseen posts are available, use a randomized selection
3. **Volume Control**: Fetch more candidates than needed (5x) to allow for effective filtering and scoring

### 3. Post Scoring Algorithm

Each post receives a composite score based on multiple factors:

```typescript
// Calculate a recency score (higher = less recently viewed)
let recencyScore = 100;  // Default high score for never viewed

// If post was recently viewed, calculate decay score
if (impressionMap.has(post.id)) {
  const lastViewed = impressionMap.get(post.id)!;
  daysSinceLastView = Math.floor((new Date().getTime() - lastViewed.getTime()) / (1000 * 60 * 60 * 24));

  // Exponential decay function - score increases as days pass
  recencyScore = Math.min(100, Math.floor(20 * Math.log(daysSinceLastView + 1)));
  
  // Mark as recently viewed if seen in the last 3 days
  if (daysSinceLastView < 3) {
    viewedRecently = true;
  }
}

// Quality component based on vote count
const qualityWeight = (post._count.vote || 0) / 5;  // Up to 20 points for 100 votes

// Recency bonus adds points based on days since last view
const recencyBonus = daysSinceLastView * 2;  // 2 points per day since last view

// Controlled randomness factor (0-60 points)
const randomFactor = Math.random() * 60;

// Final combined score
const combinedScore = recencyScore + qualityWeight + randomFactor + recencyBonus;
```

### 4. Sophisticated Sorting Methodology

Posts undergo a multi-stage sorting process:

1. **Recency-Based Segmentation**: Divide posts into recently viewed vs. not recently viewed
   ```typescript
   const recentlyViewed = processedPosts.filter((p) => p.viewedRecently);
   const notRecentlyViewed = processedPosts.filter((p) => !p.viewedRecently);
   ```

2. **Randomization with Fisher-Yates Shuffle**:
   ```typescript
   const shuffle = (array: any[]) => {
     for (let i = array.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [array[i], array[j]] = [array[j], array[i]];
     }
     return array;
   };
   ```

3. **Score Band Sorting**: Group similar-scoring posts to maintain diversity within quality tiers
   ```typescript
   notRecentlyViewed.sort((a, b) => {
     // Round scores to nearest 10 to create score bands
     const aBand = Math.floor(a.combinedScore / 10);
     const bBand = Math.floor(b.combinedScore / 10);

     if (aBand === bBand) return 0; // Keep shuffle order within bands
     return bBand - aBand; // Higher bands first
   });
   ```

4. **Temporal Sorting for Recent Content**: Sort previously seen content by time since last view
   ```typescript
   recentlyViewed.sort((a, b) => b.daysSinceLastView - a.daysSinceLastView);
   ```

### 5. Creator Diversity Enforcement

The algorithm enforces creator diversity through multiple mechanisms:

```typescript
// Select posts ensuring creator diversity
for (const post of sortedPosts) {
  // Skip if already included
  if (finalPosts.some((p) => p.id === post.id)) continue;

  // Skip if this creator appears in the last 2 posts (prevents back-to-back)
  if (lastThreeCreators.slice(-2).includes(post.creatorId)) continue;

  // Skip if this would make 3 posts from same creator in the final set
  const creatorPostCount = finalPosts.filter(
    (p) => p.creatorId === post.creatorId
  ).length;
  if (creatorPostCount >= 2) continue;

  // Add post to final selection
  finalPosts.push(post);
  lastThreeCreators.push(post.creatorId);

  // Keep lastThreeCreators to the last 3 entries
  if (lastThreeCreators.length > 3) {
    lastThreeCreators.shift();
  }

  // Break when we have enough
  if (finalPosts.length >= limit) break;
}
```

This ensures that:
- No creator appears back-to-back in the feed
- No creator has more than 2 posts in a single page
- Creator rotation is tracked to maximize diversity

### 6. Fallback Cascade

If the initial strict diversity rules don't yield enough posts, the algorithm relaxes constraints in stages:

1. First relaxation: Allow creators to appear non-consecutively
2. Second relaxation: Include any remaining posts regardless of creator

### 7. Impression Tracking

The algorithm carefully tracks impressions to:

1. Update post impression counts
2. Record user viewing history
3. Maintain cookies for both authenticated and anonymous users
4. Limit stored history to prevent excessive data growth

## Implementation Details

### Session Storage

For authenticated users, viewed posts are stored with timestamps:
```typescript
cookies().set({
  name: seenPostsKey,
  value: JSON.stringify(allSeenPosts),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60, // 1 hour for session storage
  sameSite: 'lax',
  path: '/',
});
```

For anonymous users, a simpler storage approach is used:
```typescript
cookies().set({
  name: 'viewedPosts',
  value: JSON.stringify(updatedViewedPosts),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  sameSite: 'lax',
  path: '/',
});
```

### Database Operations

1. **Transaction-Based Updates**: All impression updates are performed in a single transaction
2. **Batch Processing**: Bulk updates are used for efficiency
3. **Duplicate Prevention**: `skipDuplicates: true` prevents redundant impression records

## Performance Optimization

1. **Request Limiting**: Fetches capped at 100 posts to prevent excessive database load
2. **Efficient Queries**: Selective inclusion of related data
3. **Pagination**: Results are paginated with intelligent next page handling
4. **Minimal Response**: Internal scoring fields are stripped from responses

## Response Format

The endpoint returns a clean response format:
```typescript
return c.json({
  data: cleanPosts,
  hasMore: true,
  nextPage: !hasMore ? 1 : usedRandomFallback ? 1 : page + 1,
  isRandomized: usedRandomFallback,
});
```

This includes:
- The final selected posts (cleaned of internal fields)
- Pagination information
- Flag indicating if randomization was used (for frontend awareness)

## Integration with Voting System

The algorithm leverages the platform's sophisticated voting system by:
1. Excluding posts the user has already voted on
2. Using weighted vote counts for quality assessment
3. Including vote data in post responses

## Comparison to Other Platform Algorithms

Unlike many social media algorithms that prioritize engagement at all costs, this algorithm:

1. **Prevents Echo Chambers**: Through controlled randomization and creator diversity
2. **Respects User Experience**: By avoiding repetitive content and prioritizing unseen posts
3. **Balances Quality and Discovery**: Through the multi-factor scoring approach
4. **Promotes Content Fairness**: By preventing individual creator dominance

## Future Enhancement Opportunities

1. **Machine Learning Integration**: Add user preference learning based on viewing patterns
2. **Content Categorization**: Group posts by topics for more varied content mix
3. **Time-Based Adjustments**: Adapt scoring based on time of day or user activity patterns
4. **A/B Testing Framework**: Enable testing of algorithm variants to optimize engagement