# Voting Algorithm Documentation

## Overview

The voting algorithm is a sophisticated system designed to calculate weighted votes for social media posts. It accounts for various factors including user reputation, account age, activity levels, demographic contexts, voting patterns, and more. The goal is to provide a fair and balanced rating system that reduces the impact of spam, biased voting, and manipulation while promoting high-quality engagement.

## Core Components

The algorithm consists of several interconnected components:

1. **Base Weight Calculation**: Determines a user's fundamental voting power
2. **Demographic Weight Adjustment**: Adjusts vote weight based on demographic contexts
3. **Voting Pattern Analysis**: Analyzes and adjusts for consistent voting behaviors
4. **Rating Distribution Management**: Calculates and maintains rating statistics
5. **User Metrics Tracking**: Updates user profiles with voting history and patterns
6. **Vote Validation**: Prevents duplicate votes and enforces voting rules
7. **Activity Logging**: Records voting activity for transparency and analysis

## Weight Calculation Process

### 1. Base Weight Calculation

Base weight determines a user's fundamental voting power based on:



- **Account Age**: Newer accounts receive a reduced weight (0.7×) if less than 30 days old
- **Verification Status**: Verified users receive an increased weight (1.2×)
- **Activity Score**: Users gain additional weight based on their platform engagement

```typescript
Activity Score = (commentCount × 0.2) + (photoCount × 0.3) + (totalVotesGiven × 0.1) +
                (totalSpent × 0.01) + (votingStreak × 0.1)
```

The activity factor is calculated as: `1 + min(activityScore × 0.001, 0.5)`

Final base weight equals: `accountAgeFactor × verificationFactor × activityFactor`

### 2. Demographic Weight Adjustment

This component adjusts vote weight based on demographic relationships between voters and content creators:

- **Gender/Orientation Context**: When a straight user votes on content from the same gender, their weight is multiplied by 0.5
- **Age Gap Consideration**: Large age differences (≥20 years) between voter and creator reduces weight to 0.8×
- **Voting Tendency Adjustment**:
  - Low voters (avg rating ≤ 5) get a bonus (1.2×)
  - High voters (avg rating ≥ 9) get a penalty (0.8×)
- **Rating Extremity**: Extremely high or low ratings (≤2 or ≥9) get reduced weight (0.7×)

### 3. Voting Pattern Analysis

The system analyzes a user's voting history over the past 30 days to detect patterns:

- **Extreme Voting**: Users who frequently give extreme ratings (≤2 or ≥9) have their votes penalized with a 0.8× multiplier
- **Consistency Bonus**: Users with consistent voting patterns receive a 1.2× bonus
- **Distribution Analysis**: Users who tend to rate lower (avg ≤ 5) receive a 1.2× multiplier; those who rate high (avg ≥ 8) receive a 0.8× multiplier

Pattern weight calculation requires at least 5 votes in the past 30 days.

### 4. Anonymous User Handling

Anonymous votes (users who aren't logged in) automatically receive a significantly reduced weight of 0.3.

## Rating Calculation and Storage

### Rating Distribution

The system maintains detailed rating distributions for each post, storing:

- Count of each rating value (1-10)
- Total number of votes
- Weighted sum of ratings
- Total weight across all votes

From this distribution, the system calculates two key metrics:

1. **Average Rating**: Simple arithmetic mean of all ratings

   ```
   averageRating = (sum of all ratings) / (number of ratings)
   ```

2. **Weighted Average Rating**: Accounts for the weight of each vote
   ```
   weightedAverage = (sum of rating × weight for each vote) / (sum of all weights)
   ```

## User Metrics and Updates

After each vote, the system updates key user metrics:

- **Total Votes Given**: Incremented with each vote
- **Average Rating Given**: Recalculated as a running average
- **Voting Pattern Classification**:
  - `LOW_VOTER`: Average rating ≤ 5
  - `NEUTRAL`: Average rating between 5-8
  - `HIGH_VOTER`: Average rating ≥ 8
- **Last Active Time**: Updated to track user engagement

## Anti-Abuse Measures

The algorithm implements several safeguards against abuse:

- **Duplicate Vote Prevention**: Checks for existing votes from the same user ID or IP address
- **Self-Vote Prevention**: Users cannot vote on their own content
- **Outlier Detection**: Extreme votes can be flagged for further analysis
- **Comprehensive Vote Logging**: All votes are logged with their weight factors for auditing

## Implementation Details

### Constants and Configuration

The algorithm uses carefully tuned constants to adjust the influence of different factors:

```typescript
// Weight factors for base calculation
const WEIGHT_FACTORS = {
  NEW_ACCOUNT: 0.7,
  VERIFIED_USER: 1.2,
  ACTIVITY_MULTIPLIER: 0.001,
  MAX_ACTIVITY_BONUS: 0.5,
};

// Factors for demographic adjustments
const DEMOGRAPHIC_FACTORS = {
  SAME_GENDER_STRAIGHT: 0.5,
  AGE_GAP_THRESHOLD: 20,
  AGE_GAP_MULTIPLIER: 0.8,
  LOW_VOTER_BONUS: 1.2,
  HIGH_VOTER_PENALTY: 0.8,
  EXTREME_RATING_MULTIPLIER: 0.7,
};

// Factors for voting pattern analysis
const PATTERN_FACTORS = {
  EXTREME_VOTE_THRESHOLD: 0.7,
  CONSISTENCY_THRESHOLD: 0.6,
  MIN_VOTES_REQUIRED: 5,
  EXTREME_PENALTY: 0.8,
  CONSISTENCY_BONUS: 1.2,
};
```

### Data Types

The algorithm uses strongly typed structures to ensure data integrity:

- `UserActivityMetrics`: User engagement statistics
- `VoteWeightFactors`: Components affecting vote weight
- `DemographicFactors`: Demographic relationship influences
- `UserDemographics`: User profile information
- `VotePattern`: User's voting behavior analysis
- `RatingDistribution`: Post rating statistics
- `RatingMetrics`: Calculated rating summaries

## Voting Process Flow

1. User submits a rating for a post
2. System validates the user and post
3. System checks for duplicate votes
4. Vote weight is calculated:
   - For registered users: Base × Demographic × Pattern weights
   - For anonymous users: Fixed 0.3 weight
5. Vote is recorded with all weight factors
6. Post rating distribution is updated
7. User metrics are updated
8. Activity is logged
9. Response is returned with weight information

## Practical Example

Consider a verified user (1.2×) with a 6-month old account (1.0×) and moderate activity score of 200 (1.0 + 200 × 0.001 = 1.2×):

- Base weight: 1.0 × 1.2 × 1.2 = 1.44

If they vote on content from someone with similar demographics but have demonstrated balanced voting patterns:

- Demographic weight: 1.0 (neutral)
- Pattern weight: 1.2 (consistency bonus)

Final vote weight: 1.44 × 1.0 × 1.2 = 1.728

This vote would have 1.728× the influence of a standard vote when calculating the post's weighted average rating.

## Performance and Scalability

The algorithm is designed with performance in mind:

- Parallel processing of weight calculations where possible
- Efficient database queries with selective field retrieval
- Precomputed metrics to avoid recalculating values repeatedly

## Conclusion

This voting algorithm creates a sophisticated weighting system that rewards positive community contributors while reducing the impact of manipulation, spam, and extreme voting patterns. By accounting for multiple factors including user reputation, demographics, and voting history, the system aims to produce more meaningful and representative ratings.
