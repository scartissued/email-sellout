# Email Sellout

![Email Sellout Demo](./demo.mov)

**Email Sellout** is a Chrome extension designed to help you manage email aliases and track website spam effortlessly.

## What is it?
Have you ever wondered which website leaked or sold your email address to spammers? Email Sellout solves this problem. 

Whenever you register on a new website, Email Sellout suggests a unique, domain-specific email alias using the "+ alias" trick (e.g., `your.email+websitename@gmail.com`). The extension then saves this alias to your personal database. You can open the extension popup at any time to view a paginated dashboard of all the websites you've registered on and the exact aliases you used for each.

## Why is it needed?
- **Track Spam:** By uniquely identifying every service you sign up for, you can immediately tell who shared your data if you start receiving spam to that specific alias.
- **Easy Filtering:** You can easily set up inbox filters (e.g., in Gmail) based on the alias used to organize your emails or block services entirely.
- **Security & Privacy:** Minimizes the risk of your primary email address becoming a target in data breaches by compartmentalizing your registrations.

---

## Technical Details

### Technologies Used
- **Frontend Framework:** React 18
- **Build Tool:** Vite with `@crxjs/vite-plugin` for hot-reloading Chrome extension development
- **Backend/BaaS:** Supabase (for User Authentication and Database storage of aliases)
- **Styling:** Vanilla CSS with a glassmorphism/modern dark UI
- **Icons:** Lucide React

### Environment Variables
Before running the extension, you need to configure your Supabase backend. Create a `.env` file in the root directory and add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
You must create the `aliases` table in your Supabase project with Row Level Security (RLS) enabled. You can run the following snippet in your Supabase SQL Editor:

```sql
CREATE TABLE public.aliases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    base_email TEXT NOT NULL,
    domain TEXT NOT NULL,
    alias_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect the table
ALTER TABLE public.aliases ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own data
CREATE POLICY "Users can manage their own aliases" 
ON public.aliases
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Startup / Clone Method

Follow these steps to clone the repository, install dependencies, and run the development server:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd email-sellout
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file based on the environment variables mentioned above.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *Running this command will start Vite with hot-reloading and generate a `dist` folder.*

5. **Load the Extension into Chrome:**
   - Open Google Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** in the top right corner.
   - Click the **Load unpacked** button.
   - Select the newly created `dist` folder located inside the `email-sellout` project directory.

Once loaded, any code changes you make will be automatically recompiled by Vite and reloaded in Chrome!
