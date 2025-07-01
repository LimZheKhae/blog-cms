-- Enhanced seed data with realistic posts, views, comments, and likes
-- Run this after the basic seed data (02-seed-data.sql)

-- Insert more realistic posts with HTML content from TipTap
INSERT INTO posts (title, slug, content, excerpt, status, author_id, tags, reading_time_minutes, views_count, likes_count) VALUES
  (
    'The Future of Web Development: Trends to Watch in 2024',
    'future-web-development-trends-2024',
    '<h1>Introduction</h1>
<p>The web development landscape is constantly evolving, and 2024 promises to be a year of significant transformation. From artificial intelligence integration to new architectural patterns, developers are witnessing unprecedented changes that will shape how we build and interact with web applications.</p>

<h2>The Rise of AI-Powered Development</h2>
<p>Artificial Intelligence is no longer just a buzzword—it''s becoming an integral part of the development workflow. <strong>GitHub Copilot</strong>, <strong>ChatGPT</strong>, and other AI tools are revolutionizing how developers write code, debug issues, and even architect solutions.</p>

<h3>Key AI Integration Points:</h3>
<ul>
  <li><strong>Code Generation</strong>: AI can generate boilerplate code, saving hours of development time</li>
  <li><strong>Bug Detection</strong>: Advanced static analysis powered by machine learning</li>
  <li><strong>Performance Optimization</strong>: AI-driven suggestions for code improvements</li>
  <li><strong>Documentation</strong>: Automated generation of comprehensive documentation</li>
</ul>

<h2>Modern JavaScript Frameworks</h2>
<p>The JavaScript ecosystem continues to mature with frameworks focusing on performance and developer experience.</p>

<img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop" alt="Web Development" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>Conclusion</h2>
<p>The future of web development is bright, with AI augmentation, improved frameworks, and new technologies paving the way for more powerful and efficient web applications.</p>

<blockquote>
  <p>Developers who embrace these trends will be well-positioned to build the next generation of web experiences.</p>
</blockquote>',
    'Explore the cutting-edge trends that will shape web development in 2024, from AI integration to new frameworks and revolutionary technologies.',
    'published',
    2,
    '{"JavaScript", "React", "AI", "WebDev", "2024", "Technology"}',
    8,
    1234,
    89
  ),
  (
    'Building Scalable React Applications',
    'building-scalable-react-applications',
    '<h1>Building Scalable React Applications</h1>
<p>As React applications grow in complexity, it becomes crucial to implement proper architectural patterns and best practices to ensure maintainability and performance.</p>

<h2>Component Architecture</h2>
<p>The foundation of any scalable React application lies in its component architecture. Here are the key principles:</p>

<ul>
  <li><strong>Single Responsibility</strong>: Each component should have one clear purpose</li>
  <li><strong>Composition over Inheritance</strong>: Use composition to build complex UIs</li>
  <li><strong>Props Interface Design</strong>: Design clear and minimal prop interfaces</li>
</ul>

<h2>State Management</h2>
<p>For large applications, proper state management is essential. Consider these approaches:</p>

<ol>
  <li><strong>Local State</strong>: Use useState for component-specific state</li>
  <li><strong>Context API</strong>: For sharing state across component trees</li>
  <li><strong>External Libraries</strong>: Redux, Zustand, or Jotai for complex state</li>
</ol>

<pre><code class="language-javascript">// Example of a scalable component structure
const UserProfile = ({ userId }) => {
  const { user, loading, error } = useUser(userId);
  
  if (loading) return &lt;LoadingSpinner /&gt;;
  if (error) return &lt;ErrorMessage error={error} /&gt;;
  
  return (
    &lt;div className="user-profile"&gt;
      &lt;UserAvatar user={user} /&gt;
      &lt;UserDetails user={user} /&gt;
      &lt;UserActions user={user} /&gt;
    &lt;/div&gt;
  );
};</code></pre>

<h2>Performance Optimization</h2>
<p>Performance is critical for user experience. Key optimization techniques include:</p>

<ul>
  <li>Code splitting with React.lazy()</li>
  <li>Memoization with useMemo and useCallback</li>
  <li>Virtual scrolling for large lists</li>
  <li>Image optimization and lazy loading</li>
</ul>

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop" alt="React Development" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>Testing Strategy</h2>
<p>A comprehensive testing strategy ensures your application remains reliable as it scales:</p>

<blockquote>
  <p>Write tests that give you confidence, not just coverage.</p>
</blockquote>

<p>Focus on integration tests that verify user workflows rather than testing implementation details.</p>',
    'Learn the best practices and architectural patterns for building large-scale React applications that grow with your team and user base.',
    'published',
    3,
    '{"React", "JavaScript", "Architecture", "Performance", "Testing", "Frontend"}',
    12,
    856,
    67
  ),
  (
    'Design Systems: Creating Consistency at Scale',
    'design-systems-consistency-scale',
    '<h1>Design Systems: Creating Consistency at Scale</h1>
<p>In today''s multi-platform world, maintaining design consistency across products is more challenging than ever. Design systems provide the solution.</p>

<h2>What is a Design System?</h2>
<p>A design system is a collection of reusable components, guided by clear standards, that can be assembled together to build any number of applications.</p>

<h3>Core Components of a Design System:</h3>
<ul>
  <li><strong>Design Tokens</strong>: Colors, typography, spacing, and other visual properties</li>
  <li><strong>Component Library</strong>: Reusable UI components with consistent behavior</li>
  <li><strong>Documentation</strong>: Guidelines on when and how to use components</li>
  <li><strong>Tools & Resources</strong>: Figma libraries, code repositories, and design assets</li>
</ul>

<h2>Building Your Design System</h2>
<p>Start small and grow organically. Here''s a proven approach:</p>

<ol>
  <li><strong>Audit Existing Designs</strong>: Identify patterns and inconsistencies</li>
  <li><strong>Define Design Tokens</strong>: Establish your visual vocabulary</li>
  <li><strong>Create Core Components</strong>: Button, Input, Card, etc.</li>
  <li><strong>Document Everything</strong>: Make it easy for others to adopt</li>
  <li><strong>Iterate and Improve</strong>: Continuously refine based on feedback</li>
</ol>

<img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=400&fit=crop" alt="Design System" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>Implementation Strategies</h2>
<p>Different organizations require different approaches:</p>

<h3>Centralized Approach</h3>
<p>A dedicated team maintains the design system, ensuring consistency but potentially slowing innovation.</p>

<h3>Federated Approach</h3>
<p>Multiple teams contribute to the system, fostering innovation but requiring strong governance.</p>

<h3>Hybrid Approach</h3>
<p>Combines both models - core team for foundation, distributed teams for domain-specific components.</p>

<blockquote>
  <p>The best design system is the one that gets used. Focus on adoption over perfection.</p>
</blockquote>

<h2>Measuring Success</h2>
<p>Track these metrics to measure your design system''s impact:</p>

<ul>
  <li>Component adoption rate across teams</li>
  <li>Design-to-development handoff time</li>
  <li>Brand consistency scores</li>
  <li>Developer satisfaction and productivity</li>
</ul>',
    'How to build and maintain design systems that ensure consistency across your entire product ecosystem while enabling teams to move fast.',
    'published',
    2,
    '{"Design", "UI/UX", "Systems", "Frontend", "Consistency", "Scalability"}',
    10,
    743,
    52
  ),
  (
    'Advanced TypeScript Patterns for React Developers',
    'advanced-typescript-patterns-react',
    '<h1>Advanced TypeScript Patterns for React Developers</h1>
<p>TypeScript has become essential for building robust React applications. Let''s explore advanced patterns that will level up your development experience.</p>

<h2>Generic Components</h2>
<p>Create flexible, reusable components with generics:</p>

<pre><code class="language-typescript">interface ListProps&lt;T&gt; {
  items: T[];
  renderItem: (item: T) =&gt; React.ReactNode;
  keyExtractor: (item: T) =&gt; string;
}

function List&lt;T&gt;({ items, renderItem, keyExtractor }: ListProps&lt;T&gt;) {
  return (
    &lt;ul&gt;
      {items.map(item =&gt; (
        &lt;li key={keyExtractor(item)}&gt;
          {renderItem(item)}
        &lt;/li&gt;
      ))}
    &lt;/ul&gt;
  );
}</code></pre>

<h2>Conditional Types for Props</h2>
<p>Use conditional types to create intelligent component APIs:</p>

<pre><code class="language-typescript">type ButtonProps&lt;T extends ElementType&gt; = {
  as?: T;
  children: React.ReactNode;
} &amp; ComponentPropsWithoutRef&lt;T&gt;;

function Button&lt;T extends ElementType = "button"&gt;({
  as,
  children,
  ...props
}: ButtonProps&lt;T&gt;) {
  const Component = as || "button";
  return &lt;Component {...props}&gt;{children}&lt;/Component&gt;;
}</code></pre>

<h2>Discriminated Unions</h2>
<p>Model complex state with discriminated unions:</p>

<pre><code class="language-typescript">type AsyncState&lt;T&gt; =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function useAsyncData&lt;T&gt;(fetcher: () =&gt; Promise&lt;T&gt;) {
  const [state, setState] = useState&lt;AsyncState&lt;T&gt;&gt;({ status: "idle" });
  
  // Implementation...
  
  return state;
}</code></pre>

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop" alt="TypeScript Code" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>Higher-Order Components with Types</h2>
<p>Create type-safe HOCs that preserve component props:</p>

<pre><code class="language-typescript">function withLoading&lt;P extends object&gt;(
  Component: React.ComponentType&lt;P&gt;
) {
  return function WithLoadingComponent(
    props: P &amp; { isLoading: boolean }
  ) {
    if (props.isLoading) {
      return &lt;div&gt;Loading...&lt;/div&gt;;
    }
    
    const { isLoading, ...componentProps } = props;
    return &lt;Component {...(componentProps as P)} /&gt;;
  };
}</code></pre>

<h2>Utility Types for React</h2>
<p>Leverage TypeScript''s utility types for cleaner code:</p>

<ul>
  <li><code>Pick&lt;T, K&gt;</code> - Extract specific properties</li>
  <li><code>Omit&lt;T, K&gt;</code> - Exclude specific properties</li>
  <li><code>Partial&lt;T&gt;</code> - Make all properties optional</li>
  <li><code>Required&lt;T&gt;</code> - Make all properties required</li>
</ul>

<blockquote>
  <p>TypeScript''s type system is incredibly powerful. The key is to start simple and gradually adopt more advanced patterns as your needs grow.</p>
</blockquote>',
    'Master advanced TypeScript patterns to build more robust and maintainable React applications with better developer experience.',
    'published',
    3,
    '{"TypeScript", "React", "Advanced", "Patterns", "Development", "Types"}',
    15,
    634,
    43
  ),
  (
    'Modern CSS Techniques for 2024',
    'modern-css-techniques-2024',
    '<h1>Modern CSS Techniques for 2024</h1>
<p>CSS continues to evolve rapidly. Here are the cutting-edge techniques you should know in 2024.</p>

<h2>Container Queries</h2>
<p>Finally, we can style components based on their container size, not just the viewport:</p>

<pre><code class="language-css">.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}</code></pre>

<h2>CSS Grid Subgrid</h2>
<p>Subgrid allows nested grids to participate in their parent''s grid:</p>

<pre><code class="language-css">.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.child {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
}</code></pre>

<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop" alt="CSS Code" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>CSS Cascade Layers</h2>
<p>Take control of the cascade with explicit layer ordering:</p>

<pre><code class="language-css">@layer reset, base, components, utilities;

@layer base {
  body { font-family: system-ui; }
}

@layer components {
  .button { padding: 1rem; }
}</code></pre>

<h2>Modern Color Functions</h2>
<p>New color functions provide more intuitive color manipulation:</p>

<ul>
  <li><code>oklch()</code> - Perceptually uniform color space</li>
  <li><code>color-mix()</code> - Mix colors in different color spaces</li>
  <li><code>light-dark()</code> - Automatic light/dark mode colors</li>
</ul>

<h2>CSS Nesting</h2>
<p>Native CSS nesting is finally here:</p>

<pre><code class="language-css">.card {
  padding: 1rem;
  
  &amp; .title {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  &amp;:hover {
    transform: translateY(-2px);
  }
}</code></pre>

<blockquote>
  <p>These new CSS features reduce the need for preprocessors and JavaScript solutions, making CSS more powerful and maintainable.</p>
</blockquote>',
    'Discover the latest CSS features and techniques that are revolutionizing how we style modern web applications in 2024.',
    'draft',
    2,
    '{"CSS", "Modern", "Techniques", "2024", "Frontend", "Styling"}',
    7,
    0,
    0
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert post views for tracking
INSERT INTO post_views (post_id, user_id, ip_address, user_agent) VALUES
  -- Views for "The Future of Web Development" post
  (1, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
  (1, 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
  (1, 3, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'),
  (1, 4, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'),
  -- Views for "Building Scalable React Applications" post
  (2, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
  (2, 4, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'),
  -- Views for "Design Systems" post
  (3, 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
  (3, 3, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')
ON CONFLICT DO NOTHING;

-- Insert post likes
INSERT INTO post_likes (post_id, user_id) VALUES
  -- Likes for "The Future of Web Development" post
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  -- Likes for "Building Scalable React Applications" post
  (2, 1),
  (2, 4),
  -- Likes for "Design Systems" post
  (3, 2),
  (3, 3)
ON CONFLICT DO NOTHING;

-- Insert more detailed comments
INSERT INTO comments (content, status, post_id, author_id) VALUES
  ('This is an excellent overview of the current web development landscape! The section on AI-powered development particularly resonates with my recent experience using GitHub Copilot. It has genuinely transformed how I approach coding problems.', 'approved', 1, 4),
  ('Great insights on React architecture! I''ve been struggling with state management in our large application, and your suggestions about when to use Context vs external libraries are very helpful.', 'approved', 2, 1),
  ('The component composition patterns you described are exactly what we need for our design system. Thank you for the practical examples!', 'approved', 2, 4),
  ('As a designer working closely with developers, this article perfectly captures the challenges we face with design systems. The hybrid approach you mentioned sounds like it could work well for our organization.', 'approved', 3, 1),
  ('Love the practical examples in this post. The generic components section saved me hours of refactoring. TypeScript''s type system is indeed incredibly powerful when used correctly.', 'approved', 4, 2),
  ('Container queries are a game-changer! I''ve been waiting for this feature for years. Finally, we can create truly responsive components.', 'approved', 5, 3),
  ('This is still a work in progress comment that needs moderation.', 'pending', 1, 3),
  ('Another pending comment for the React article.', 'pending', 2, 2)
ON CONFLICT DO NOTHING;

-- Update posts table with correct counts based on actual data
UPDATE posts SET 
  views_count = (SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id),
  likes_count = (SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id)
WHERE id IN (1, 2, 3, 4, 5);

-- Add some sample data for the original posts from 02-seed-data.sql as well
INSERT INTO post_views (post_id, user_id, ip_address, user_agent) VALUES
  (6, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
  (6, 4, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'),
  (7, 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
ON CONFLICT DO NOTHING;

INSERT INTO post_likes (post_id, user_id) VALUES
  (6, 1),
  (6, 4),
  (7, 2)
ON CONFLICT DO NOTHING;

-- Final update for all posts
UPDATE posts SET 
  views_count = COALESCE((SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id), 0),
  likes_count = COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id), 0);

-- Display summary
SELECT 
  p.title,
  p.status,
  p.views_count,
  p.likes_count,
  COUNT(c.id) as comments_count
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id AND c.status = 'approved'
GROUP BY p.id, p.title, p.status, p.views_count, p.likes_count
ORDER BY p.created_at DESC; 