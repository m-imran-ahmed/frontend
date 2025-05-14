import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const from = state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 mt-6 md:mt-8">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side - Welcome Section */}
            <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-pink-400/80 to-purple-500/80 p-8">
              <div className="h-full flex flex-col justify-center text-white/90">
                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-lg mb-6 text-pink-50/90">
                  Discover and book the perfect venue for your special day.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <span className="text-white/90">Access to exclusive venues</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <span className="text-white/90">Easy booking process</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <span className="text-white/90">24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full md:w-1/2 p-6 md:p-8">
              <div className="max-w-sm mx-auto">
                <div className="text-center mb-6">
                  <LogIn className="h-10 w-10 text-pink-600 mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-gray-800">Log in to FindMyVenue</h1>
                  <p className="text-gray-600 mt-1">Welcome back! Please enter your details.</p>
                  {state?.message && (
                    <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md text-sm">
                      {state.message}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="form-input pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="form-input pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-pink-600 hover:text-pink-700">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    type="submit"
                    isLoading={isLoading}
                  >
                    Log In
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                        />
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                      Facebook
                    </button>
                  </div>

                  <div className="text-center text-sm">
                    <p className="text-gray-600">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-pink-600 hover:text-pink-700 font-medium">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;