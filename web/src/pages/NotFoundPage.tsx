import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export function NotFoundPage() {
  return (
    <div className="not-found">
      <h1 className="not-found__title">404</h1>
      <p className="not-found__text">This path does not exist.</p>
      <Link to="/characters" className="not-found__link">
        Back to Characters
      </Link>
    </div>
  )
}
