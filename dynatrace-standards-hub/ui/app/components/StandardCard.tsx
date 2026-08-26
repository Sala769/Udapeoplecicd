import React from "react";
import { Link } from "react-router-dom";
import { Standard } from "../types";
import { MaturityBadge } from "./MaturityBadge";

interface Props {
  standard: Standard;
  adopted: boolean;
  onToggleAdopted: (id: string) => void;
}

export const StandardCard = ({ standard, adopted, onToggleAdopted }: Props) => (
  <div className={`standard-card ${adopted ? "adopted" : ""}`}>
    <label className="standard-card-checkbox" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={adopted} onChange={() => onToggleAdopted(standard.id)} />
      <span className="sr-only">Mark {standard.title} as adopted</span>
    </label>
    <Link to={`/standard/${standard.id}`} className="standard-card-body">
      <div className="standard-card-header">
        <span className="standard-card-id">{standard.id}</span>
        <MaturityBadge maturity={standard.maturity} />
      </div>
      <h4>{standard.title}</h4>
      <p>{standard.statement}</p>
    </Link>
  </div>
);
