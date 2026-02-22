Akademi Inovasi Guru (AI Guru) platform.

1. Application Flow (User Journey)
The application is divided into two main experiences: the flow for the teachers who are learning, and the flow for you as the content creator.

   A. Participant Flow (Learning Teacher)
- Registration & Onboarding: Teachers visit the homepage, view the course catalog (e.g., "Creating Interactive LKPD", "Learning Websites"), and register for a new account using their email and password.
- Catalog Exploration: After logging in, participants are directed to the Student Dashboard. They can choose available free or premium courses and click "Enroll in Course".
- Digital Classroom: Participants enter the learning interface. On the left side is a list of chapters and materials (navigation). In the center/right area is the content section where they watch explanation videos (streaming smoothly directly from the MinIO server) or read text modules.
- Progress Tracking: Every time they finish watching a video or reading a material, participants click the "Mark as Complete" button. The progress bar will increase accordingly (e.g., from 0% to 10%).
- Evaluation & Assignments: At the end of a module, participants take a multiple-choice quiz or upload a link to the learning media project they have created.
- Graduation & Certification: Once the progress bar reaches 100%, the system automatically generates a PDF E-Certificate with the participant's name. This certificate can be downloaded immediately for administrative purposes or professional development.

  B. Admin Flow (Content Creator)
- Syllabus Management: Logging into the Admin Dashboard, you create drafts for new courses, structure the module hierarchy (Chapter 1, Chapter 2), and add material sessions to each chapter.
- Centralized Media Upload: You upload screencast video files, course thumbnails, and PDF documents (like guides or templates). The system automatically routes and stores these heavy files into the MinIO bucket on the VPS, keeping the SQLite database lightweight.
- Publication & Monitoring: Once the material is complete, you change the course status from "Draft" to "Published". You can also view simple analytics: which teachers have enrolled and how far along their learning progress is.

2. Key Features
To ensure a professional, seamless, and independent experience, this platform will be powered by the following essential features:
- Self-Hosted Authentication System: Uses a secure (encrypted) internal login system without relying on paid third-party services.
- Dynamic Course Catalog: A landing page displaying a list of classes in the form of cards with title information, brief descriptions, thumbnails (from MinIO), and price/free labels.
- Video Streaming Player: A custom video player inside the classroom that pulls video data from MinIO, designed to be responsive (comfortable to watch on both laptops and smartphones).
- Learning Progress Management (Stateful LMS): A system that always remembers where the participant last left off, supported by an SQLite database that records every "Mark as Complete" click on materials.
- Automated Certificate Generator: A behind-the-scenes PDF engine that takes a base template, overlays the participant's name and course title, and saves it as a digital archive.
- Admin CMS (Content Management System): A dedicated panel hidden from participants, giving you full access (CRUD: Create, Read, Update, Delete) to manage users, courses, and media files.