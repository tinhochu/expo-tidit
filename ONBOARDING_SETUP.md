# Onboarding System Setup

This document explains how to set up the Appwrite database for the ZenGamer onboarding system.

## Overview

The onboarding system collects user preferences after login and stores them in Appwrite. Users are redirected to onboarding if they haven't completed it yet.

## Appwrite Database Setup

### 1. Create Database

1. Go to your Appwrite Console
2. Navigate to **Databases** → **Create Database**
3. Set Database ID: `zengamer_db`
4. Set Database Name: `ZenGamer Database`

### 2. Create Collection

1. In your database, click **Create Collection**
2. Set Collection ID: `user_preferences`
3. Set Collection Name: `User Preferences`

### 3. Collection Attributes

Add the following attributes to your collection:

| Attribute ID  | Type    | Required | Default | Array |
| ------------- | ------- | -------- | ------- | ----- |
| `userId`      | String  | Yes      | -       | No    |
| `isOnboarded` | Boolean | Yes      | false   | No    |
| `preferences` | Object  | Yes      | -       | No    |
| `createdAt`   | String  | Yes      | -       | No    |
| `updatedAt`   | String  | Yes      | -       | No    |

### 4. Collection Permissions

Set the following permissions:

**Read Permission:**

- Role: `users`
- Condition: `$userId == $userId`

**Write Permission:**

- Role: `users`
- Condition: `$userId == $userId`

**Delete Permission:**

- Role: `users`
- Condition: `$userId == $UserId`

### 5. Environment Variables

Add these to your `.env` file:

```env
EXPO_PUBLIC_APPWRITE_DATABASE_ID=zengamer_db
EXPO_PUBLIC_APPWRITE_USER_PREFERENCES_COLLECTION_ID=user_preferences
```

## How It Works

1. **User Authentication**: User signs in/signs up
2. **Onboarding Check**: System checks if user has completed onboarding
3. **Onboarding Flow**: If not onboarded, user is redirected to `/onboarding`
4. **Preference Collection**: User answers questions about gaming preferences
5. **Data Storage**: Preferences are saved to Appwrite database
6. **App Access**: User is redirected to main app with preferences loaded

## Onboarding Steps

1. **Welcome**: Introduction and get started button
2. **Gaming Experience**: Beginner/Intermediate/Advanced selection
3. **Favorite Genres**: Multi-select from available genres
4. **Gaming Time**: Casual/Moderate/Dedicated selection
5. **Review**: Summary of all preferences
6. **Complete**: Save to database and redirect to app

## Skip Option

Users can skip onboarding and use default preferences:

- Gaming Experience: Beginner
- Favorite Genres: None
- Gaming Time: Casual
- Notifications: On
- Theme: Auto

## User Preferences Structure

```typescript
interface UserPreferences {
  gamingExperience: 'beginner' | 'intermediate' | 'advanced'
  favoriteGenres: string[]
  gamingTime: 'casual' | 'moderate' | 'dedicated'
  notifications: boolean
  theme: 'light' | 'dark' | 'auto'
}
```

## Database Document Structure

```json
{
  "$id": "user_id_here",
  "userId": "user_id_here",
  "isOnboarded": true,
  "preferences": {
    "gamingExperience": "intermediate",
    "favoriteGenres": ["Action", "RPG"],
    "gamingTime": "moderate",
    "notifications": true,
    "theme": "auto"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check collection permissions and user roles
2. **Document Not Found**: Ensure collection ID matches environment variable
3. **Database Connection**: Verify Appwrite endpoint and project ID

### Testing

1. Create a test user account
2. Sign in and verify onboarding redirect
3. Complete onboarding flow
4. Check database for saved preferences
5. Sign out and sign back in to verify persistence

## Future Enhancements

- Add preference editing after onboarding
- Implement preference-based content recommendations
- Add onboarding completion analytics
- Support for multiple preference profiles
