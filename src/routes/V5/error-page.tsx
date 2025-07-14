import { useRouteError, useNavigate } from "react-router-dom";
import styles from './error-page.module.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';

interface RouteError {
  status?: number;
  statusText?: string;
  message?: string;
  data?: string;
  name?: string;
  stack?: string;
}

export default function ErrorPage() {
  const error = useRouteError() as RouteError;
  const navigate = useNavigate();

  console.error(error);

  // Determine error type and messaging
  const getErrorInfo = () => {
    if (error?.status === 404) {
      return {
        title: "Page Not Found",
        subtitle: "The page you're looking for doesn't exist or has been moved.",
        icon: "🔍"
      };
    } else if (error?.status && error.status >= 500) {
      return {
        title: "Server Error",
        subtitle: "Something went wrong on our end. Please try again later.",
        icon: "🔧"
      };
    } else {
      return {
        title: "Oops! Something Went Wrong",
        subtitle: "An unexpected error has occurred. Don't worry, it's not your fault.",
        icon: "⚠️"
      };
    }
  };

  const { title, subtitle, icon } = getErrorInfo();

  const handleGoHome = () => {
    navigate('/');
  };

  const getErrorMessage = () => {
    return error?.message ||
           error?.statusText ||
           error?.data ||
           `${error?.status || 'Unknown'} Error`;
  };

  return (
    <>
      <SidebarWithMenu currentPage="error" />
      <div className={styles.errorPage}>
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              {icon}
            </div>

            <h1 className={styles.errorTitle}>{title}</h1>
            <p className={styles.errorSubtitle}>{subtitle}</p>

            <div className={styles.errorDetails}>
              <div className={styles.errorDetailsTitle}>Error Details</div>
              <div className={styles.errorMessage}>
                {getErrorMessage()}
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={handleGoHome}
                className={styles.button}
              >
                🏠 Go Home
              </button>
            </div>

            <div className={styles.helpText}>
              If this problem persists, please contact support or try again later.
              <br />
              <strong>Need help?</strong> Check the browser console for more details.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}