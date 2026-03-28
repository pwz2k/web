# Top Creators Today Algorithm Documentation

## Overview

The `top-creators-today` endpoint identifies and ranks the most engaging content creators on the platform based on their post performance within the current day. If fewer than 3 top creators are found for the current day, the algorithm supplements results with high-performing creators from recent days.

## Data Collection

### Primary Data Source
- Posts updated within the current calendar day (midnight to midnight)
- Only approved posts are considered
- Each post includes detailed creator information, vote counts, comment counts, and vote quality metrics

### Key Data Points Collected
1. **Post Metrics**: 
   - Vote count
   - Comment count
   - Impression count
   - Average rating
   - Weighted rating (incorporating vote quality)

2. **Creator Context**:
   - Verification status
   - Activity score
   - Demographic information (gender, date of birth)
   - Voting pattern

3. **Vote Quality**:
   - Individual vote weights
   - User reputation weight
   - Context weight
   - Vote rating
   - Outlier status (excluded from calculations)

## Scoring Algorithm

### Post Engagement Score Calculation

Each post's engagement score combines multiple weighted factors:

1. **Vote Score**: 
   ```
   voteScore = post._count.vote * voteWeight * (totalVoteWeight / post._count.vote || 1)
   ```
   - `voteWeight = 2` (base points per vote)
   - `totalVoteWeight` = sum of all individual vote weights
   - Algorithm increases value for quality votes over quantity

2. **Comment Score**:
   ```
   commentScore = post._count.comment * commentWeight
   ```
   - `commentWeight = 3` (each comment is worth 3 points)
   - Comments are weighted higher than votes to reward deeper engagement

3. **Impression Score**:
   ```
   impressionScore = post.impressions * impressionWeight
   ```
   - `impressionWeight = 0.5` (each impression is worth 0.5 points)
   - Recognizes content reach while preventing overvaluation of impressions

4. **Rating Score**:
   ```
   ratingScore = weightedAverageRating * ratingMultiplier
   ```
   - `ratingMultiplier = 5`
   - `weightedAverageRating` is calculated using the sophisticated voting algorithm:
     ```
     weightedVotes = post.vote.reduce((acc, vote) => acc + vote.rating * vote.weight, 0)
     totalVoteWeight = post.vote.reduce((acc, vote) => acc + vote.weight, 0) || 1
     weightedAverageRating = post.vote.length > 0 ? weightedVotes / totalVoteWeight : post.averageRating
     ```
   - Outlier votes (identified by voting algorithm) are excluded to prevent manipulation

### Creator Reputation Multiplier

A creator's reputation amplifies their content's engagement score:

```
creatorFactor = post.creator.isVerified ? 1.2 : 1.0
activityBonus = Math.min(post.creator.activityScore * 0.001, 0.5)
```

- Verified creators get a 20% boost
- Active creators receive up to 50% additional boost based on platform activity
- Maximum combined reputation multiplier is 1.7x (1.2 + 0.5)

### Final Engagement Score

The final engagement score for each post is calculated as:

```
engagementScore = (voteScore + commentScore + impressionScore + ratingScore) * (creatorFactor + activityBonus)
```

## Creator Ranking Process

1. The algorithm calculates engagement scores for all posts updated today
2. Posts are sorted by engagement score in descending order
3. The top 3 posts are selected
4. If fewer than 3 posts are available from today:
   - Recent posts from previous days are retrieved
   - The same scoring algorithm is applied with an additional recency penalty
   - Recency penalty: `recencyFactor = Math.max(0.5, 1 - Math.log10(daysSinceCreation) * 0.1)`
   - Recent posts cannot drop below 50% of their original score due to age
   - Posts are sorted and the top posts are selected to supplement today's results

## Response Format

The endpoint returns:
- Post details (ID, caption, image)
- Creator information
- Engagement metrics (score, weighted rating, vote/comment counts)
- Flag indicating if the post is from today or a recent supplemental post
- Message explaining the composition of results

## Implementation Notes

1. **Vote Quality**:
   - The algorithm uses the sophisticated voting system to filter out low-quality votes
   - Votes marked as outliers are excluded from calculations
   - Individual vote weights impact the final score, prioritizing votes from reputable users

2. **Recency Bias**:
   - Posts from today are prioritized over older posts
   - Logarithmic decay ensures older quality content can still appear when necessary
   - Maximum age penalty is 50% (recencyFactor never drops below 0.5)

3. **Failsafe Measures**:
   - If no posts meet criteria, appropriate messages are returned
   - Backup search expands to older content when necessary
   - Multiple sorting and filtering steps ensure result quality

## Alignment with Platform Values

The algorithm reinforces platform priorities by:
- Rewarding quality engagement over quantity
- Giving weight to user reputation and trust signals
- Balancing metrics (votes, comments, impressions, ratings)
- Promoting active and verified creators
- Minimizing manipulation through outlier detection

This ensures that "Top Creators Today" represents genuine engagement rather than artificial metrics, aligning with the platform's focus on quality community interactions.

## Integration with Voting Algorithm

The "Top Creators Today" algorithm directly integrates with the platform's sophisticated voting system:

1. **Vote Weight Integration**:
   - Individual votes are weighted based on the voting algorithm's assessment
   - Each vote's `weight` property represents the calculated importance, combining:
     - Base weight (depends on user account age and verification)
     - User weight (based on voting history and reputation)
     - Context weight (considers demographic and situational factors)

2. **Outlier Filtering**:
   - Votes flagged as outliers by the voting system are excluded
   - This prevents manipulation through extreme ratings or suspicious patterns
   - Filter applied directly in the database query: `where: { isOutlier: false }`

3. **User Reputation Factors**:
   - Creator verification status aligns with voting algorithm's `VERIFIED_USER` constant (1.2x)
   - Activity score calculation uses the same `ACTIVITY_MULTIPLIER` (0.001) as voting
   - Maximum activity bonus (0.5) matches the `MAX_ACTIVITY_BONUS` from voting algorithm

4. **Quality Over Quantity**:
   - Like the voting system, top creators are determined by weighted quality metrics
   - High vote volume doesn't guarantee top ranking if votes are low-quality
   - Vote weight influences rating more than raw vote count

5. **Common Constants**:
   - Verification boost (1.2x) matches `WEIGHT_FACTORS.VERIFIED_USER`
   - Activity multiplier (0.001) matches `WEIGHT_FACTORS.ACTIVITY_MULTIPLIER`
   - Maximum activity bonus (0.5) matches `WEIGHT_FACTORS.MAX_ACTIVITY_BONUS`

By maintaining consistent weighting factors and quality assessments across both algorithms, the platform ensures that top creators truly represent the community's most valued contributors.