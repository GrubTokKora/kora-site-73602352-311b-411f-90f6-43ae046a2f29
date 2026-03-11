type HoursProps = {
  hours: {
    [day: string]: string;
  };
};

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Hours({ hours }: HoursProps) {
  return (
    <section id="hours">
      <div className="container">
        <h2>Opening Hours</h2>
        <ul className="hours-list">
          {weekDays.map(day => (
            <li key={day}>
              <span className="day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
              <span className="time">{hours[day] || 'Closed'}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Hours;