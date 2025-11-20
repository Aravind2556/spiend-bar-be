function formatTimestamp(ts) {
    try {
        const date = new Date(ts);

        // Convert to IST
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

        const day = String(istDate.getDate()).padStart(2, '0');
        const month = String(istDate.getMonth() + 1).padStart(2, '0');
        const year = istDate.getFullYear();

        let hours = istDate.getHours();
        const minutes = String(istDate.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // 12 AM / PM adjust

        const time = `${hours}:${minutes} ${ampm}`;

        return `${day}-${month}-${year} ${time}`;
        // output: 19-11-2025 06:51 PM

    } catch (err) {
        return new Date().toISOString();
    }
}

module.exports = { formatTimestamp };
