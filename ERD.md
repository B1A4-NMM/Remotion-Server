# Entity Relationship Diagram

```mermaid
erDiagram
    ActivityCluster {
        string id PK
        number clusteredCount
        string label
        number centroid
    }
    ActivityEmotion {
        number id PK
        EmotionType emotion
        EmotionGroup emotionGroup
        EmotionBase emotionBase
        number intensitySum
        number count
    }
    Activity {
        number id PK
        string content
        number vector
        LocalDate date
        string | null strength
        string | null weakness
    }
    ActivityTarget {
        number id PK
    }
    Alias {
        number id PK
        string name
    }
    DiaryAchievementCluster {
        string id PK
        number clusteredCount
        string label
        number centroid
    }
    DiaryAchievement {
        number id PK
        string content
        number vector
    }
    DiaryEmotion {
        number id PK
        EmotionType emotion
        EmotionBase emotionBase
        number intensity
    }
    DiaryTarget {
        number id PK
        number changeScore
    }
    DiaryTodo {
        number id PK
        string content
        LocalDate createdAt
    }
    Diary {
        number id PK
        LocalDate create_date
        LocalDate written_date
        string content
        string title
        Weather weather
        string photo_path
        string audio_path
        boolean is_bookmarked
        number latitude
        number longitude
        any metadata
    }
    EmotionSummaryScore {
        number id PK
        EmotionGroup emotion
        number score
        number count
    }
    EmotionTarget {
        number id PK
        EmotionType emotion
        number emotion_intensity
        number count
        LocalDate feel_date
    }
    MemberSummary {
        number id PK
        LocalDate date
    }
    Member {
        string id PK
        string email
        string nickname
        string social_type
        number daily_limit
        string character
        LocalDate stress_test_date
        LocalDate anxiety_test_date
        LocalDate depression_test_date
    }
    NotificationEntity {
        number id PK
        string content
        string | null photoPath
        LocalDateTime createDate
        boolean isRead
        number | null diaryId
        LocalDate | null targetDate
    }
    PushSubscription {
        number id PK
        string endpoint
        string p256dh
        string auth
        boolean isSubscribed
    }
    Routine {
        number id PK
        RoutineEnum routineType
        string content
        boolean isTrigger
    }
    ShareGroup {
        number id PK
        string name
    }
    Target {
        number id PK
        string name
        number count
        LocalDate recent_date
        TargetRelation relation
        TargetType type
        number affection
        number closenessScore
    }
    TodoCalendar {
        number id PK
        string content
        boolean isCompleted
        LocalDate date
    }
    Todo {
        number id PK
        string title
        boolean isCompleted
        LocalDate | null date
        boolean isRepeat
        string | null repeatRule
        LocalDate | null repeatEndDate
        LocalDate createdAt
        LocalDate updatedAt
    }
    UserShareGroup {
        number id PK
    }
    YoutubeApi {
        number id PK
        string videoId
        string title
        EmotionType emotion
        string keyword
    }

    ActivityCluster ||--o{ Activity : ""
    Activity ||--o{ ActivityEmotion : ""
    DiaryAchievementCluster ||--o{ DiaryAchievement : ""
    Diary ||--o{ DiaryTarget : ""
    Diary ||--o{ Activity : ""
    Diary ||--o{ DiaryEmotion : ""
    Diary ||--o{ DiaryTodo : ""
    MemberSummary ||--o{ EmotionSummaryScore : ""
    Member ||--o{ Diary : ""
    Member ||--o{ UserShareGroup : ""
    Member ||--o{ Target : ""
    Member ||--o{ Todo : ""
    Member ||--o{ MemberSummary : ""
    Member ||--o{ Routine : ""
    Member ||--o{ PushSubscription : ""
    Member ||--o{ NotificationEntity : ""
    ShareGroup ||--o{ Diary : ""
    ShareGroup ||--o{ UserShareGroup : ""
    Target ||--o{ DiaryTarget : ""
    Target ||--o{ EmotionTarget : ""
    Target ||--o{ Alias : ""
```
