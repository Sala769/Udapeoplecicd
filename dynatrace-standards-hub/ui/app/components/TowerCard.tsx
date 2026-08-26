import React from "react";
import { Link } from "react-router-dom";
import { Tower } from "../types";
import { standardsByTower } from "../data/standards";

export const TowerCard = ({ tower, adopted }: { tower: Tower; adopted: Set<string> }) => {
  const towerStandards = standardsByTower(tower.id);
  const adoptedCount = towerStandards.filter((s) => adopted.has(s.id)).length;
  const pct = towerStandards.length === 0 ? 0 : Math.round((adoptedCount / towerStandards.length) * 100);

  return (
    <Link to={`/tower/${tower.id}`} className="tower-card">
      <div className="tower-card-emoji">{tower.emoji}</div>
      <div className="tower-card-body">
        <h3>{tower.name}</h3>
        <p className="tower-card-tagline">{tower.tagline}</p>
        <p className="tower-card-desc">{tower.description}</p>
        <div className="tower-card-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-label">
            {adoptedCount}/{towerStandards.length} adopted
          </span>
        </div>
      </div>
    </Link>
  );
};
