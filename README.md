# SRIJON - Business Registration Platform

A comprehensive full-stack platform where business owners can register and submit detailed information about their business, products, and production capacity.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure cookies
- **6-Step Registration Wizard**: Comprehensive data collection process
  - Step 1: Basic Info & Contact (with cascading Bangladesh location dropdowns)
  - Step 2: Product Details & Production
  - Step 3: Market & Business Status (with conditional logic for documents, banking)
  - Step 4: Future Plans & Support Needs
  - Step 5: Media Uploads (Cloudinary integration)
  - Step 6: Review & Consent
- **Draft Saving**: Auto-save progress on each step
- **Private Dashboard**: View and edit submitted business data
- **File Uploads**: Images, videos, and documents via Cloudinary
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 📋 Prerequisites

- Node.js (v16+ recommended)
- MongoDB database
- Cloudinary account

## 🛠️ Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file is already configured with your MongoDB and Cloudinary credentials:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`: Your Cloudinary credentials

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 Usage

### User Flow

1. **Homepage**: Visit the homepage and click "Register Now"
2. **Registration**: Fill in name, email, and password
3. **Auto-Login**: After successful registration, you'll be automatically logged in and redirected to Step 1 of the wizard
4. **Complete Wizard**: Fill out all 6 steps of the business registration form
   - Progress is saved automatically on each "Next" click
   - You can close the browser and resume later
5. **Dashboard**: After submission, view your business data on the dashboard
6. **Edit**: Click the "Edit" button to modify your information

### Key Features Explained

**Cascading Dropdowns** (Step 1):
- Select Division → Available Districts appear
- Select District → Available Thanas appear

**Conditional Fields** (Step 1):
- Ownership Type "Partnership" → Partner Name field appears
- WhatsApp checkbox → Choose same as mobile or enter different number

**Sales Channel Logic** (Step 3):
- Online → Facebook Link & Website Link fields
- Offline → Shop Address field

**Document Uploads** (Step 3):
- Check any document → File upload button appears
- Uploaded files are stored in Cloudinary

**Bank Account** (Step 3):
- Select "Yes" → Bank details fields appear

**Mobile Banking** (Step 3):
- Check bKash/Nagad/Rocket → Number input field appears

## 🏗️ Project Structure

```
SRIJON/
├── backend/
│   ├── config/
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── businessDataController.js
│   │   └── uploadController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   └── BusinessData.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── businessData.js
│   │   └── upload.js
│   ├── data/
│   │   └── bangladesh-locations.json
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── wizard/
    │   │   │   ├── Step1BasicInfo.jsx
    │   │   │   ├── Step2ProductDetails.jsx
    │   │   │   ├── Step3MarketBusiness.jsx
    │   │   │   ├── Step4FuturePlans.jsx
    │   │   │   ├── Step5MediaUpload.jsx
    │   │   │   └── Step6Review.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Footer.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── FormContext.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── AboutPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── FormWizard.jsx
    │   │   └── Dashboard.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── public/
    │   └── bangladesh-locations.json
    └── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Business Data
- `GET /api/business` - Get user's business data
- `POST /api/business` - Create/update business data
- `PUT /api/business/:id` - Update specific business data
- `DELETE /api/business/:id` - Delete business data

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## 🎨 Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Cloudinary (file storage)
- Bcrypt (password hashing)
- Multer (file upload handling)

### Frontend
- React.js
- React Router DOM
- Tailwind CSS
- Axios
- React Icons

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
CLOUDINARY_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_SECRET_KEY=<your-cloudinary-secret>
FRONTEND_URL=http://localhost:5173
```

## 📝 Notes

- Auto-login after registration is a key feature - users are immediately redirected to the wizard
- All form data is saved as draft on each step to prevent data loss
- Only users can see and edit their own data
- File uploads support images, videos, and documents (PDF, JPG, PNG)
- Mobile numbers are prefixed with +880 (Bangladesh country code)

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running and connection string is correct
- Verify all environment variables are set in `.env`

**File uploads failing:**
- Verify Cloudinary credentials are correct
- Check file size (max 50MB)
- Ensure file types are allowed (images, videos, PDFs)

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check CORS settings in backend `server.js`

## 📄 License

MIT

## 👥 Support

For support, email support@aggrigo.com or create an issue in the repository.

---

**Built with ❤️ for Bangladesh's business community**
