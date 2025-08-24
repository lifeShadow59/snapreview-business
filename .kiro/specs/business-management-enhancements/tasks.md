# Implementation Plan

- [ ] 1. Database Schema Setup and Migrations
  - Create database migration scripts for new language preferences table
  - Add language_code and rating columns to existing business_feedbacks table
  - Create necessary indexes for performance optimization
  - Write rollback migration scripts for safety
  - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 2. Enhanced Tag Management System
  - [ ] 2.1 Create reusable TagSelector component
    - Implement autocomplete functionality with predefined tag suggestions
    - Add visual tag chips with remove functionality
    - Include input validation and maximum tag limits
    - Write unit tests for tag selection behavior
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Update AddBusinessForm to use TagSelector
    - Replace existing tag input with new TagSelector component
    - Ensure tags are properly stored in database during business creation
    - Maintain backward compatibility with existing tag storage
    - _Requirements: 1.1, 1.5_

  - [ ] 2.3 Update EditBusinessForm to use TagSelector
    - Integrate TagSelector component in business edit form
    - Pre-populate existing tags when editing business
    - Implement tag update functionality in API endpoint
    - _Requirements: 1.3, 1.4_

- [ ] 3. Dashboard Business List Integration
  - [ ] 3.1 Create BusinessListItem component
    - Design business card layout with edit/delete buttons
    - Implement click handlers for edit and delete operations
    - Add confirmation dialog for delete operations
    - Write component tests for user interactions
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 3.2 Update Dashboard component for inline business list
    - Modify dashboard to show expandable business list below stats
    - Replace "View More" navigation with inline expansion
    - Implement state management for show/hide business list
    - Add empty state handling when no businesses exist
    - _Requirements: 2.1, 2.6_

  - [ ] 3.3 Implement business delete functionality
    - Create DELETE API endpoint for business removal
    - Add proper authorization and ownership validation
    - Implement cascade delete for related data (tags, feedbacks, language preferences)
    - Add error handling and user feedback
    - _Requirements: 2.4, 2.5_

- [ ] 4. Language Preference Management System
  - [ ] 4.1 Create LanguageSelector component
    - Implement dropdown with OpenRouter-supported languages
    - Add maximum 3 language selection limit
    - Include language preference locking mechanism
    - Write tests for language selection constraints
    - _Requirements: 3.1, 3.2, 3.9_

  - [ ] 4.2 Create language preferences API endpoints
    - Implement GET /api/businesses/[id]/languages endpoint
    - Implement POST /api/businesses/[id]/languages endpoint
    - Add validation for maximum 3 languages constraint
    - Include language preference locking logic
    - _Requirements: 3.2, 3.3, 3.9, 4.4_

  - [ ] 4.3 Integrate language selection in business pages
    - Add language selection to business detail page
    - Implement one-time language preference setting
    - Show current language preferences with lock status
    - Handle language preference updates and restrictions
    - _Requirements: 3.2, 3.3, 3.9_

- [ ] 5. Multilingual Feedback Generation System
  - [ ] 5.1 Create BulkFeedbackGenerator component
    - Implement language selection dropdown from business preferences
    - Add quantity selection (10, 20, 50) with default of 1
    - Create progress indicators for bulk generation
    - Include preview functionality for generated feedbacks
    - _Requirements: 3.4, 3.5, 3.6, 3.10_

  - [ ] 5.2 Implement bulk feedback generation API
    - Create POST /api/businesses/[id]/generate-bulk-feedback endpoint
    - Integrate with OpenRouter API for multiple feedback generation
    - Ensure each feedback is unique and varies in length (1-3 sentences)
    - Add proper error handling and rate limiting
    - _Requirements: 3.4, 3.5, 3.6, 3.10_

  - [ ] 5.3 Create bulk feedback save functionality
    - Implement POST /api/businesses/[id]/feedbacks/bulk endpoint
    - Add "Add All Feedbacks" button functionality
    - Store feedbacks with proper language codes and metadata
    - Include batch validation and error handling
    - _Requirements: 3.7, 3.8_

  - [ ] 5.4 Update existing feedback generation to use tags only
    - Modify existing generate-feedback API to use only provided tags
    - Remove fallback to database business information
    - Ensure AI prompts focus only on user-selected tags
    - Update error messages for missing tags scenario
    - _Requirements: 3.5, 3.6_

- [ ] 6. Enhanced Feedback Management
  - [ ] 6.1 Update feedback display with language support
    - Modify feedback list to show language indicators
    - Add language filtering functionality
    - Update feedback cards to display language information
    - Implement language-specific feedback organization
    - _Requirements: 3.7, 3.8_

  - [ ] 6.2 Update feedback API endpoints for multilingual support
    - Enhance GET /api/businesses/[id]/feedbacks with language filtering
    - Update POST /api/businesses/[id]/feedbacks to include language_code
    - Add language validation and default language handling
    - Update existing feedback endpoints to maintain backward compatibility
    - _Requirements: 3.7, 3.8, 4.2, 4.3_

- [ ] 7. Integration and Testing
  - [ ] 7.1 Write comprehensive unit tests
    - Test TagSelector component functionality
    - Test LanguageSelector component behavior
    - Test BulkFeedbackGenerator component operations
    - Test all new API endpoints with various scenarios
    - _Requirements: All requirements validation_

  - [ ] 7.2 Implement integration tests
    - Test complete tag management workflow from add to edit
    - Test dashboard business list operations end-to-end
    - Test multilingual feedback generation and storage workflow
    - Test language preference locking and validation
    - _Requirements: All requirements validation_

  - [ ] 7.3 Update existing components for consistency
    - Ensure tag display consistency across all business views
    - Update business detail page to show language preferences
    - Verify all forms use the new TagSelector component
    - Test backward compatibility with existing data
    - _Requirements: 1.2, 1.3, 1.4_

- [ ] 8. Error Handling and User Experience
  - [ ] 8.1 Implement comprehensive error handling
    - Add user-friendly error messages for all operations
    - Implement loading states for all async operations
    - Add confirmation dialogs for destructive actions
    - Include proper validation feedback for all forms
    - _Requirements: All requirements validation_

  - [ ] 8.2 Add performance optimizations
    - Implement debounced tag input for better UX
    - Add optimistic updates for immediate feedback
    - Optimize database queries with proper indexing
    - Add pagination for large feedback lists
    - _Requirements: Performance and scalability_