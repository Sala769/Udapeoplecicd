import React from "react";
import { NavLink } from "react-router-dom";
import { towers } from "../data/towers";

export const NavBar = () => (
  <nav className="nav-bar">
    <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
      Control Tower
    </NavLink>
    {towers.map((tower) => (
      <NavLink
        key={tower.id}
        to={`/tower/${tower.id}`}
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      >
        {tower.emoji} {tower.name}
      </NavLink>
    ))}
    <NavLink to="/checklist" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
      Adoption Checklist
    </NavLink>
  </nav>
);
