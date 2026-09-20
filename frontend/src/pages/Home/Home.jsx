import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-modern-layout">
      
      {/* HERO SECTION */}
      <section className="home-hero">
        <div className="hero-content">
          <p className="teal-subtext">Welcome to FREQ!</p>
          <h1 className="massive-heading">
            IMMERSIVE MUSIC <br />
            LISTENING, VR ROOMS, <br />
            AND AI DJ
          </h1>
          <button className="teal-btn" onClick={() => navigate('/room')}>Join a Live Room</button>
          
          <div className="hero-footer">
             <div className="hero-contact-item">
               <span className="icon">🎧</span>
               <div>
                 <p className="contact-label">Support Email</p>
                 <p className="contact-val">hello@freqmusic.com</p>
               </div>
             </div>
             <div className="hero-contact-item">
               <span className="icon">🌐</span>
               <div>
                 <p className="contact-label">Global Access</p>
                 <p className="contact-val">Connect with friends worldwide</p>
               </div>
             </div>
          </div>
        </div>

        <div className="hero-image-wrapper">
           <img 
             src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80" 
             alt="Headphones Hero" 
             className="hero-image"
           />
        </div>
      </section>

      {/* SPLIT INFO SECTION */}
      <section className="home-split">
        <div className="split-image-wrapper">
          <img 
            src="https://images.unsplash.com/photo-1516280440502-8598464654b0?auto=format&fit=crop&w=600&q=80" 
            alt="DJ Deck" 
            className="split-image"
          />
        </div>
        <div className="split-content">
          <p className="teal-subtext">Who We Are</p>
          <h2 className="secondary-heading">LISTENING AT IT'S FINEST!</h2>
          <p className="desc-text">
            At FREQ, we are your go-to destination for a comprehensive range of immersive music experiences. 
            Our expertise covers a wide spectrum of interactive needs, including synchronized listening, 
            spatial audio VR rooms, and real-time multiplayer avatars.
          </p>
          <p className="desc-text">
            We take great pride in our commitment to quality, ensuring you and your friends can vibe together 
            without skipping a beat.
          </p>
          <ul className="feature-list">
            <li><span className="check">✓</span> Top rated real-time synchronization</li>
            <li><span className="check">✓</span> Stunning 3D immersive environments</li>
          </ul>
        </div>
      </section>

      {/* TESTIMONIALS & FORM SECTION */}
      <section className="home-testimonials">
        <div className="test-content">
          <p className="teal-subtext">Amazed by the quality</p>
          <h2 className="secondary-heading">PEOPLE TALK ABOUT THEIR EXPERIENCES IN OUR ROOMS</h2>
          
          <div className="review-card">
            <div className="stars">★★★★★</div>
            <p className="review-text">
              "For years now, I have relied on FREQ to hang out with my friends remotely. 
              The spatial audio is simply amazing. My playlists have never sounded better, 
              and the neon rooms shine as brightly as the music!"
            </p>
            <div className="reviewer">
               <img src="https://i.pravatar.cc/150?img=47" alt="User" />
               <div>
                 <h4>Jenny Wilson</h4>
                 <p>Music Enthusiast</p>
               </div>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3>BOOK A LIVE SESSION NOW</h3>
          <p className="form-sub">Select Your Vibe</p>
          <form className="booking-form" onSubmit={(e) => { e.preventDefault(); navigate('/room'); }}>
             <select>
               <option>Select Genre</option>
               <option>Pop</option>
               <option>EDM / House</option>
               <option>Hip Hop</option>
             </select>
             <select>
               <option>Select Environment</option>
               <option>Neon Concert</option>
               <option>Cozy Bonfire</option>
             </select>
             <input type="text" placeholder="Room Name (Optional)" />
             <button type="submit" className="teal-btn full-width">Join Now</button>
             <p className="phone-num">808-343-4255</p>
          </form>
        </div>
      </section>

    </div>
  );
};

export default Home;
