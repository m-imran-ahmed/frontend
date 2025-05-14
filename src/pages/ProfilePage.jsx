import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Save, Camera } from 'lucide-react';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import { AuthContext } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, isAuthenticated, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/profile' } } });
    } else if (user) {
      // Populate form fields with user data
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setMessage({
        text: 'Passwords do not match',
        type: 'error'
      });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    // Only include fields that have values
    const updatedData = {
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      password: password || undefined
    };
    
    try {
      const result = await updateProfile(updatedData);
      
      if (result.success) {
        setMessage({
          text: 'Profile updated successfully',
          type: 'success'
        });
        // Clear password fields after successful update
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage({
          text: result.message || 'Failed to update profile',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({
        text: error.response?.data?.message || 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="page-container max-w-2xl mx-auto py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              <UserCircle className="h-20 w-20 text-pink-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
              <p className="text-gray-600 mt-2">Update your account information</p>
            </div>

            {message.text && (
              <div 
                className={`p-3 rounded-md mb-6 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="border-t border-gray-200 my-6 pt-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Change Password</h2>
                <p className="text-sm text-gray-500 mb-4">Leave blank if you don't want to change your password</p>
                
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-full sm:w-auto px-8"
                  type="submit"
                  isLoading={isLoading}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage; 