const mockData = {
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
