const formatDate = (epoch) => {
    // todo: use user timezone
    let date = new Date(epoch * 1000).toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).replace(/(\d+)\/(\d+)\/(\d+),/, '$3-$1-$2');
    return date;
  }
  export {formatDate}