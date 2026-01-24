import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeatherService, WeatherData } from '../../../services/weather.service';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  showMenu = false;
  weather: WeatherData | null = null;
  weatherLoading = false;
  isMobile = false;

  constructor(
    private weatherService: WeatherService,
    private sidebarService: SidebarService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.checkMobile();
    this.loadWeather();
  }

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  loadWeather(): void {
    this.weatherLoading = true;
    this.weatherService.getWeatherAuto().subscribe({
      next: (data) => {
        this.weather = data;
        this.weatherLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la météo:', error);
        this.weatherLoading = false;
      }
    });
  }
}
