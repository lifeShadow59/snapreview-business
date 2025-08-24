# Design Document

## Overview

This design document outlines the enhancements to the business management system, focusing on three key areas: improved tag management, dashboard business list integration, and multilingual feedback generation. The design builds upon the existing React/Next.js architecture with PostgreSQL database backend.

## Architecture

### Current System Architecture
- **Frontend**: Next.js 14 with React components and TypeScript
- **Backend**: Next.js API routes with PostgreSQL database
- **Authentication**: NextAuth.js session management
- **AI Integration**: OpenRouter API for feedback generation
- **Database**: PostgreSQL with connection pooling

### Enhanced Architecture Components
1. **Tag Management System**: Centralized tag selection component with database persistence
2. **Dashboard Integration**: Inline business list with CRUD operations
3. **Multilingual System**: Language preference storage and multilingual feedback generation
4. **Database Extensions**: New tables for language preferences and multilingual feedback

## Components and Interfaces

### 1. Enhanced Tag Management System

#### TagSelector Component
```typescript
interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}
```

**Features:**
- Autocomplete with predefined tag suggestions
- Visual tag chips with remove functionality
- Consistent behavior across add/edit forms
- Database persistence integration

#### Database Integration
- Store tags in existing `business_tags` table
- Maintain tag relationships through business_id foreign key
- Support tag CRUD operations through API endpoints

### 2. Dashboard Business List Integration

#### Enhanced Dashboard Component
```typescript
interface DashboardBusinessListProps {
  businesses: Business[];
  onEdit: (businessId: string) => void;
  onDelete: (businessId: string) => void;
  showAll: boolean;
}
```

**Features:**
- Expandable business list below dashboard stats
- Inline edit/delete buttons for each business
- Confirmation dialogs for delete operations
- Real-time list updates after operations

#### Business List Item Component
```typescript
interface BusinessListItemProps {
  business: Business;
  onEdit: () => void;
  onDelete: () => void;
  showActions: boolean;
}
```

### 3. Multilingual Feedback Generation System

#### Language Selection Component
```typescript
interface LanguageSelectorProps {
  businessId: string;
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  maxLanguages: number;
  disabled: boolean;
}
```

#### Bulk Feedback Generator Component
```typescript
interface BulkFeedbackGeneratorProps {
  businessId: string;
  availableLanguages: string[];
  businessTags: string[];
  onFeedbackGenerated: (feedbacks: MultilanguageFeedback[]) => void;
}

interface MultilanguageFeedback {
  content: string;
  language: string;
  businessId: string;
  tags: string[];
}
```

**Features:**
- Language dropdown with OpenRouter-supported languages
- Quantity selection (10, 20, 50 feedbacks)
- Bulk generation with progress indicators
- Preview and batch save functionality

## Data Models

### Enhanced Business Model
```typescript
interface Business {
  id: string;
  name: string;
  // ... existing fields
  tags: BusinessTag[];
  supportedLanguages: string[];
  languagePreferencesLocked: boolean;
}

interface BusinessTag {
  id: number;
  business_id: string;
  tag: string;
  created_at: string;
}
```

### New Language Preference Model
```typescript
interface BusinessLanguagePreference {
  id: number;
  business_id: string;
  language_code: string;
  language_name: string;
  created_at: string;
}
```

### Enhanced Feedback Model
```typescript
interface MultilanguageFeedback {
  id: number;
  business_id: string;
  content: string;
  language_code: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}
```

## Database Schema Changes

### New Tables

#### business_language_preferences
```sql
CREATE TABLE business_language_preferences (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, language_code)
);

CREATE INDEX idx_business_language_preferences_business_id ON business_language_preferences(business_id);
```

#### Enhanced business_feedbacks table
```sql
ALTER TABLE business_feedbacks 
ADD COLUMN language_code VARCHAR(10) DEFAULT 'en',
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

CREATE INDEX idx_business_feedbacks_language ON business_feedbacks(business_id, language_code);
```

### Constraints
- Maximum 3 languages per business (enforced at application level)
- Language preferences become immutable after initial selection
- Cascade delete for business-related data

## API Endpoints

### Enhanced Existing Endpoints

#### GET/POST /api/businesses/[id]/feedbacks
**Enhanced to support language filtering:**
```typescript
// Query parameters
interface FeedbackQueryParams {
  language?: string;
  limit?: number;
  offset?: number;
}

// POST body enhanced
interface CreateFeedbackRequest {
  feedback: string;
  language_code: string;
  rating?: number;
}
```

### New Endpoints

#### GET/POST /api/businesses/[id]/languages
```typescript
// GET - Retrieve business language preferences
interface LanguagePreferencesResponse {
  languages: BusinessLanguagePreference[];
  locked: boolean;
}

// POST - Set business language preferences (one-time only)
interface SetLanguagePreferencesRequest {
  languages: Array<{
    code: string;
    name: string;
  }>;
}
```

#### POST /api/businesses/[id]/generate-bulk-feedback
```typescript
interface BulkFeedbackRequest {
  language_code: string;
  quantity: 10 | 20 | 50;
  tags: string[];
}

interface BulkFeedbackResponse {
  feedbacks: Array<{
    content: string;
    language_code: string;
  }>;
  generated_count: number;
}
```

#### POST /api/businesses/[id]/feedbacks/bulk
```typescript
interface BulkSaveFeedbackRequest {
  feedbacks: Array<{
    content: string;
    language_code: string;
    rating?: number;
  }>;
}
```

## Error Handling

### Tag Management Errors
- Invalid tag format validation
- Maximum tag limit enforcement
- Database constraint violations

### Language Selection Errors
- Maximum language limit (3) enforcement
- Language preference lock validation
- Unsupported language code handling

### Feedback Generation Errors
- OpenRouter API failures with fallback messages
- Rate limiting and quota management
- Invalid language/tag combinations

### Dashboard Integration Errors
- Business deletion confirmation and rollback
- Concurrent modification handling
- Permission validation for operations

## Testing Strategy

### Unit Tests
- Tag selector component behavior
- Language preference validation logic
- Feedback generation utilities
- Database model operations

### Integration Tests
- Complete tag management workflow
- Dashboard business list operations
- End-to-end multilingual feedback generation
- API endpoint functionality

### User Acceptance Tests
- Tag consistency across add/edit forms
- Dashboard business management workflow
- Multilingual feedback generation process
- Language preference locking behavior

## Performance Considerations

### Database Optimization
- Proper indexing on foreign keys and frequently queried columns
- Connection pooling for concurrent operations
- Efficient pagination for large feedback lists

### Frontend Optimization
- Lazy loading for business lists
- Debounced tag input for better UX
- Optimistic updates for immediate feedback

### API Optimization
- Batch operations for bulk feedback generation
- Caching for language preferences
- Rate limiting for AI generation endpoints

## Security Considerations

### Authentication & Authorization
- Session validation for all operations
- Business ownership verification
- User-specific data isolation

### Data Validation
- Input sanitization for all user inputs
- SQL injection prevention
- XSS protection for displayed content

### API Security
- Rate limiting for expensive operations
- API key protection for external services
- Request size limitations

## Migration Strategy

### Database Migrations
1. Create new language preferences table
2. Add language columns to existing feedback table
3. Migrate existing feedback data to default language (en)
4. Add necessary indexes and constraints

### Code Migration
1. Update existing components to use enhanced tag system
2. Modify dashboard to include inline business list
3. Integrate multilingual feedback system
4. Update API endpoints with new functionality

### Rollback Plan
- Database migration rollback scripts
- Feature flag system for gradual rollout
- Backup and restore procedures for data safety