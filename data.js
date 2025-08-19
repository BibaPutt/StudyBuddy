export const mentors = [
    {
        id: 1,
        name: 'Dr. Sarah Chen',
        headline: 'Senior Software Engineer at Google',
        rating: 4.9,
        reviewsCount: 127,
        sessionsCount: 156,
        studentsCount: 89,
        languages: ['🇺🇸', '🇨🇳'],
        price: 1500,
        subjects: ['Python', 'Machine Learning', 'Data Science'],
        available: true,
        verified: true,
        features: ['Screen Share', 'Homework Help', 'Interview Prep'],
        experience: 'Expert',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        profile: {
            videoThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
            bio: 'Dr. Sarah Chen is a Senior Software Engineer at Google with over 8 years of experience in machine learning and data science. She holds a Ph.D. in Computer Science from Stanford University and has published numerous papers in top-tier conferences.',
            education: [
                { degree: 'Ph.D. in Computer Science', school: 'Stanford University', year: '2018-2022' }
            ],
            philosophy: 'I believe in hands-on learning and real-world applications. My approach focuses on building strong fundamentals while working on practical projects that students can add to their portfolios.',
            achievements: ['Google ML Certification', 'AWS Solutions Architect'],
            courses: [
                { title: 'Python for Beginners', difficulty: 'Beginner', description: 'Learn Python fundamentals with hands-on projects, covering data types, loops, functions, and basic data structures.', duration: 8, price: 1200 },
                { title: 'Advanced Machine Learning', difficulty: 'Advanced', description: 'Dive deep into neural networks, reinforcement learning, and model deployment with TensorFlow and PyTorch.', duration: 12, price: 2500 }
            ],
            reviews: [
                { student: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', rating: 5, date: '2 days ago', text: 'Sarah is an amazing teacher! She explains complex topics in a simple way and is very patient. Highly recommended!' },
                { student: 'Michael Brown', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=40&h=40&fit=crop&crop=face', rating: 5, date: '1 week ago', text: 'The machine learning course was fantastic. The hands-on projects were invaluable for my portfolio.' }
            ],
            schedule: {
                'Mon': ['9am - 11am', '1pm - 5pm'],
                'Tue': ['1pm - 5pm'],
                'Wed': ['9am - 12pm'],
                'Thu': ['10am - 2pm'],
                'Fri': ['9am - 1pm'],
                'Sat': [],
                'Sun': ['1pm - 4pm']
            }
        }
    },
    {
        id: 2,
        name: 'Prof. Rajesh Kumar',
        headline: 'Mathematics Professor at IIT Delhi',
        rating: 4.8,
        reviewsCount: 89,
        sessionsCount: 120,
        studentsCount: 65,
        languages: ['🇮🇳', '🇺🇸'],
        price: 1200,
        subjects: ['Calculus', 'Linear Algebra', 'Statistics'],
        available: true,
        verified: true,
        features: ['Screen Share', 'Exam Focused'],
        experience: 'Expert',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        profile: {
            videoThumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
            bio: 'Prof. Rajesh Kumar is a distinguished Mathematics Professor at IIT Delhi with over 15 years of teaching experience. He specializes in advanced calculus, linear algebra, and statistical modeling, guiding students to excel in competitive exams and research.',
            education: [
                { degree: 'Ph.D. in Mathematics', school: 'Indian Institute of Technology Delhi', year: '2005-2009' },
                { degree: 'M.Sc. in Applied Mathematics', school: 'University of Delhi', year: '2003-2005' }
            ],
            philosophy: 'My teaching philosophy emphasizes conceptual clarity and problem-solving skills. I believe in fostering a deep understanding of mathematical principles through rigorous practice and real-world examples.',
            achievements: ['National Mathematics Olympiad Coach', 'Published Author in Pure Mathematics'],
            courses: [
                { title: 'Advanced Calculus', difficulty: 'Advanced', description: 'Comprehensive course on multivariable calculus, vector calculus, and differential equations.', duration: 10, price: 1500 },
                { title: 'Linear Algebra Fundamentals', difficulty: 'Intermediate', description: 'Master vector spaces, matrices, eigenvalues, and their applications in data science and engineering.', duration: 8, price: 1200 }
            ],
            reviews: [
                { student: 'Anjali Sharma', avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face', rating: 5, date: '3 days ago', text: 'Prof. Kumar made complex topics so easy to understand. His patience and clear explanations are unmatched!' },
                { student: 'Rahul Gupta', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face', rating: 4, date: '2 weeks ago', text: 'Excellent course on Linear Algebra. Some topics were challenging, but the professor was always available for doubts.' }
            ],
            schedule: {
                'Mon': ['10am - 12pm', '3pm - 5pm'],
                'Tue': [],
                'Wed': ['9am - 11am', '2pm - 4pm'],
                'Thu': ['10am - 1pm'],
                'Fri': ['11am - 1pm'],
                'Sat': ['10am - 12pm'],
                'Sun': []
            }
        }
    },
];

export const userProfile = {
    coinBalance: 450,
    recentTransactions: [
        { type: 'payment', description: 'Session with Dr. Chen', date: '2 days ago', amount: -1500 },
        { type: 'purchase', description: 'Learner Pack', date: '5 days ago', amount: 5500 },
        { type: 'bonus', description: 'First Purchase Bonus', date: '5 days ago', amount: 500 },
        { type: 'payment', description: 'Session with R. Kumar', date: '1 week ago', amount: -1200 },
    ]
};

export const dashboardData = {
    mentorProfile: {
        name: 'Ananya S.',
        headline: 'Expert in Python & Data Science',
        bio: 'With over 8 years of experience in software development and data analytics, I help students master Python for data science, machine learning, and web development. My teaching philosophy is hands-on and project-based.',
        subjects: ['Python', 'Data Analysis', 'SQL', 'React', 'Machine Learning'],
        avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    },
    settings: {
        notifications: {
            email: true,
            push: false,
            newBookings: true,
            cancellations: true,
            newMessage: true,
            payouts: true,
        },
        password: 'hashed_password_placeholder',
        linkedAccounts: {
            google: 'ananya.s@gmail.com',
            stripe: 'acct_123456789'
        }
    },
    notifications: [
        { id: 1, text: 'Priya Singh just booked a session for "React Hooks".', time: '15m ago', read: false, icon: 'fa-calendar-check' },
        { id: 2, text: 'Your payout of 5,000 coins has been processed.', time: '2h ago', read: false, icon: 'fa-hand-holding-usd' },
        { id: 3, text: 'New 5-star review from Rohan Verma!', time: '1d ago', read: true, icon: 'fa-star' },
        { id: 4, text: 'Reminder: Session with Sameer Khan tomorrow at 10 AM.', time: '1d ago', read: true, icon: 'fa-clock' },
    ],
    sessions: [
        { id: 1, student: 'Rohan Verma', subject: 'Advanced Python', date: 'Oct 26, 2023', status: 'Completed', earnings: 1500 },
        { id: 2, student: 'Priya Singh', subject: 'React Hooks', date: 'Oct 28, 2023', status: 'Upcoming', earnings: 1200 },
        { id: 3, student: 'Sameer Khan', subject: 'Data Structures', date: 'Oct 24, 2023', status: 'Cancelled', earnings: 0 },
        { id: 4, student: 'Aisha Patel', subject: 'Advanced Python', date: 'Oct 29, 2023', status: 'Upcoming', earnings: 1500 },
        { id: 5, student: 'Vikram Reddy', subject: 'Intro to SQL', date: 'Oct 30, 2023', status: 'Upcoming', earnings: 1000 },
    ],
    courses: [
        { id: 1, title: 'Advanced Python for Data Science', students: 12, status: 'Published', price: 1500 },
        { id: 2, title: 'React for Beginners', students: 8, status: 'Published', price: 1200 },
        { id: 3, title: 'Web Development Bootcamp', students: 0, status: 'Draft', price: 2000 },
    ],
    conversations: [
        { id: 1, student: 'Priya Singh', lastMessage: 'Great, see you then!', timestamp: '10:42 AM', unread: 1, avatar: 'https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
        { id: 2, student: 'Rohan Verma', lastMessage: 'Thank you for the session!', timestamp: 'Yesterday', unread: 0, avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
        { id: 3, student: 'Sameer Khan', lastMessage: 'Sorry, I have to cancel.', timestamp: '3 days ago', unread: 2, avatar: 'https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    ],
    messages: {
        1: [
            { sender: 'Priya Singh', text: 'Hi Ananya, I\'m really looking forward to our session on React Hooks!', time: '10:30 AM' },
            { sender: 'Ananya S.', text: 'Hi Priya! Me too. Make sure you have Node.js and VS Code installed beforehand.', time: '10:31 AM' },
            { sender: 'Priya Singh', text: 'Will do. Thanks for the heads up!', time: '10:32 AM' },
            { sender: 'Priya Singh', text: 'Great, see you then!', time: '10:42 AM' },
        ],
        3: [
            { sender: 'Sameer Khan', text: 'Hi, something urgent came up and I won\'t be able to make our session.', time: '3 days ago' },
            { sender: 'Sameer Khan', text: 'Sorry, I have to cancel.', time: '3 days ago' },
        ]
    },
    earnings: {
        balance: 18250.00,
        transactions: [
            { date: 'Oct 26', description: 'Session: Rohan Verma', amount: 1500.00, type: 'credit' },
            { date: 'Oct 25', description: 'Payout to Bank Account', amount: -5000.00, type: 'debit' },
            { date: 'Oct 23', description: 'Session: Aisha Patel', amount: 1250.00, type: 'credit' },
        ]
    },
    chartData: {
        monthly: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            data: [3200, 4500, 2800, 5000]
        },
        biannual: {
            labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            data: [9600, 10500, 12500, 11000, 14000, 18250]
        }
    }
};
