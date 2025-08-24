# Requirements Document

## Introduction

This feature enhances the business management system with improved tag management, dashboard navigation, and multilingual feedback generation capabilities. The enhancements focus on providing a seamless user experience for managing business tags, viewing all businesses from the dashboard, and generating diverse multilingual customer feedback.

## Requirements

### Requirement 1: Enhanced Tag Management System

**User Story:** As a business owner, I want to manage business tags consistently across add and edit forms, so that I can maintain accurate business categorization and ensure tags are properly stored and displayed.

#### Acceptance Criteria

1. WHEN adding a new business THEN the system SHALL display a tag selection interface that stores selected tags in the database
2. WHEN viewing business details THEN the system SHALL display the stored business tags
3. WHEN editing a business THEN the system SHALL show the same tag selection interface as the add form with pre-selected existing tags
4. WHEN tags are modified during editing THEN the system SHALL update the tags in the database
5. IF no tags are selected THEN the system SHALL allow business creation but store an empty tag array

### Requirement 2: Dashboard Business List Integration

**User Story:** As a user, I want to view and manage all businesses directly from the dashboard, so that I can quickly access, edit, or delete businesses without navigating to separate pages.

#### Acceptance Criteria

1. WHEN clicking "View More" or "View All Businesses" on dashboard THEN the system SHALL display the business list below the dashboard content instead of navigating to a separate page
2. WHEN the business list is displayed THEN each business SHALL show edit and delete buttons on the right side
3. WHEN clicking the edit button THEN the system SHALL navigate to the business edit page
4. WHEN clicking the delete button THEN the system SHALL prompt for confirmation and delete the business upon confirmation
5. WHEN a business is deleted THEN the system SHALL refresh the business list automatically
6. IF there are no businesses THEN the system SHALL display an appropriate empty state message

### Requirement 3: Multilingual Feedback Generation System

**User Story:** As a business owner, I want to generate customer feedback in multiple languages, so that I can cater to diverse customer bases and create realistic multilingual reviews.

#### Acceptance Criteria

1. WHEN accessing feedback generation THEN the system SHALL display a language selection dropdown with OpenRouter-supported languages
2. WHEN selecting languages THEN the user SHALL be able to choose maximum 3 languages with English as default
3. WHEN languages are confirmed THEN the system SHALL store the language preferences in the database and make them non-editable for that business
4. WHEN generating feedback THEN the user SHALL select one language from their chosen languages and specify quantity (10, 20, or 50 feedbacks)
5. WHEN feedback is generated THEN each feedback SHALL be 1-3 sentences long and based only on the business tags
6. WHEN feedback generation is complete THEN the system SHALL display all generated feedbacks with an "Add All Feedbacks" button
7. WHEN "Add All Feedbacks" is clicked THEN the system SHALL store all feedbacks in the database with the selected language
8. WHEN feedbacks are stored THEN each feedback SHALL include the language code, business ID, content, and creation timestamp
9. IF a business already has language preferences set THEN the system SHALL not allow modification of language selection
10. WHEN generating bulk feedbacks THEN each feedback SHALL be unique and varied in length (1-3 sentences)

### Requirement 4: Database Schema for Multilingual Feedback

**User Story:** As a developer, I want a clear database schema for multilingual feedback storage, so that the system can efficiently store and retrieve feedback data across different languages.

#### Acceptance Criteria

1. WHEN storing business language preferences THEN the system SHALL use a `business_languages` table with business_id, language_code, and created_at fields
2. WHEN storing generated feedbacks THEN the system SHALL use a `feedbacks` table with id, business_id, language_code, content, rating, and created_at fields
3. WHEN querying feedbacks THEN the system SHALL support filtering by business_id and language_code
4. WHEN a business is deleted THEN the system SHALL cascade delete all associated language preferences and feedbacks
5. IF language preferences exist for a business THEN the system SHALL enforce the 3-language limit constraint