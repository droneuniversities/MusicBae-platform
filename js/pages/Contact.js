// ===== CONTACT PAGE COMPONENT =====
const { useState, useEffect } = React;

function ContactPage({ goTo }) {
  const { theme } = window.useApp();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! (This is a demo)');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="pt-20 pb-24 px-4 max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-space font-bold text-white mb-6">Contact MusicBae</h1>
      <div className="card p-6 md:p-10">
        <p className="text-white/80 leading-relaxed mb-6 text-lg">
          We’re here to help. Whether you have a question, need assistance with your account, or simply wish to share your thoughts, our team is ready to support you.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-white/70 break-all">support@musicbae.com</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="text-xl font-bold text-white mb-2">Mailing Address</h3>
            <p className="text-white/70">Music Before Anyone Else<br/>1980 Park Centre Dr.<br/>Las Vegas, Nevada</p>
          </div>
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="text-xl font-bold text-white mb-2">Business & Media</h3>
            <p className="text-white/70">For partnerships and press, email <span className="underline">support@musicbae.com</span> with “Business Inquiry” in the subject.</p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5 mb-8">
          <h3 className="text-xl font-bold text-white mb-2">Community Feedback</h3>
          <p className="text-white/70">We value the voices of both artists and fans. Share ideas, every suggestion helps us improve and grow.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/90 mb-2 font-medium">Name</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-white/90 mb-2 font-medium">Email</label>
            <input
              type="email"
              className="input w-full"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-white/90 mb-2 font-medium">Message</label>
            <textarea
              rows="4"
              className="input w-full resize-none"
              placeholder="Your message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary w-full">Send Message</button>
        </form>
        <div className="mt-6 pt-6 border-t border-white/10">
          <button className="btn btn-outline" onClick={() => goTo('home')}>
            Back to Home
          </button>
        </div>
      </div>
      
      {/* Logo Section */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center">
            <img 
              src={isDark ? "/assets/images/music-baee-with-dots.webp" : "/assets/images/music-baee-logo-with-dots.webp"} 
              alt="MusicBae Logo" 
              className="max-w-xs max-h-32 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export component
window.ContactPage = ContactPage; 