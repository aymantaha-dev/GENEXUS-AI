const formatResponse = (data, message = 'Success', status = 200) => {
  return {
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

const formatError = (error, status = 500) => {
  const errorMessage = error.message || 'Internal server error';
  const errorDetails = process.env.NODE_ENV === 'development' ? error : undefined;
  
  return {
    success: false,
    status,
    message: errorMessage,
    error: errorDetails,
    timestamp: new Date().toISOString()
  };
};

const formatPollinationsError = (error) => {
  let status = 500;
  let message = 'Pollinations.ai API error';
  
  if (error.response) {
    status = error.response.status;
    message = error.response.data?.message || `Pollinations.ai API returned status ${status}`;
  } else if (error.request) {
    message = 'No response from Pollinations.ai API';
  }
  
  return formatError({ message, details: error.message }, status);
};

module.exports = {
  formatResponse,
  formatError,
  formatPollinationsError
};