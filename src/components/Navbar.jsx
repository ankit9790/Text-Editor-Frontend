// import React from "react";
// import ProfileMenu from "./ProfileMenu";

// export default function Navbar({ user, onShareClick }) {
//   return (
//     <nav className="navbar">
//       <h3 className="navbar-title">Collaborative Editor</h3>

//       <div className="navbar-right">
//         {/* SHARE BUTTON */}
//         <button className="share-navbar-btn" onClick={onShareClick}>
//           Share
//         </button>

//         {/* NOTIFICATION ICON */}
//         <div className="notif-icon">🔔</div>

//         {/* PROFILE MENU */}
//         <ProfileMenu
//           user={user}
//           onLogout={() => {
//             window.dispatchEvent(new CustomEvent("logoutRequested"));
//           }}
//         />
//       </div>
//     </nav>
//   );
// }


import React from "react";
import ProfileMenu from "./ProfileMenu";

export default function Navbar({ user, onShareClick }) {
  return (
    <nav className="navbar">
      <h3 className="navbar-title">Collaborative Editor</h3>

      <div className="navbar-right">
        {/* SHARE BUTTON */}
        <button className="share-navbar-btn" onClick={onShareClick}>
          Share
        </button>

        {/* PROFILE MENU */}
        <ProfileMenu
          user={user}
          onLogout={() => {
            window.dispatchEvent(new CustomEvent("logoutRequested"));
          }}
        />
      </div>
    </nav>
  );
}
